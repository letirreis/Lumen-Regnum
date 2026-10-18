import { supabase } from './supabase';

export const MEDIA_BUCKET = 'dmos-media';
export type MediaEntity = 'npc' | 'location' | 'item' | 'monster' | 'character' | 'faction';
export type MediaKind = 'portrait' | 'map';

export interface MediaRow {
  id: string;
  campaign_id: string;
  entity_type: MediaEntity;
  entity_id: string;
  kind: MediaKind;
  path: string;
  size_bytes: number;
  mime: string;
  created_at: string;
}

export const MEDIA_ENTITIES: readonly string[] = ['npc', 'location', 'item', 'monster', 'character', 'faction'];

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // antes de comprimir
const MAX_OUTPUT_BYTES = 3 * 1024 * 1024; // mesmo limite do bucket (o servidor também confere)
const MAX_DIMENSION = 1600;

export class MediaInputError extends Error {
  constructor(public code: 'type' | 'size' | 'process') {
    super(code);
  }
}

/** Valida e comprime a imagem no navegador (WebP, lado maior ≤ 1600px). Economiza cota e tráfego. */
export async function prepareImage(file: File): Promise<{ blob: Blob; mime: string; ext: string }> {
  if (!ACCEPTED.includes(file.type)) throw new MediaInputError('type');
  if (file.size > MAX_INPUT_BYTES) throw new MediaInputError('size');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new MediaInputError('process');
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new MediaInputError('process');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const toBlob = (type: string, q: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
  let blob = await toBlob('image/webp', 0.82);
  let mime = 'image/webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob('image/jpeg', 0.85); // navegadores sem suporte a WebP no canvas
    mime = 'image/jpeg';
  }
  if (!blob) throw new MediaInputError('process');
  if (blob.size > MAX_OUTPUT_BYTES) throw new MediaInputError('size');
  return { blob, mime, ext: mime === 'image/webp' ? 'webp' : 'jpg' };
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
};

export async function listMedia(campaignId: string, entityType?: MediaEntity, entityId?: string): Promise<MediaRow[]> {
  const sb = requireClient();
  let q = sb.from('dmos_media').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: true });
  if (entityType) q = q.eq('entity_type', entityType);
  if (entityId) q = q.eq('entity_id', entityId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as MediaRow[];
}

export async function uploadMedia(args: {
  campaignId: string;
  entityType: MediaEntity;
  entityId: string;
  kind: MediaKind;
  file: File;
}): Promise<MediaRow> {
  const sb = requireClient();
  const { blob, mime, ext } = await prepareImage(args.file);
  const { data: sess } = await sb.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) throw new Error('NOT_AUTHENTICATED');

  const path = `${uid}/${args.campaignId}/${crypto.randomUUID()}.${ext}`;
  const up = await sb.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: mime, upsert: false, cacheControl: '3600' });
  if (up.error) throw up.error;

  const { data, error } = await sb.from('dmos_media').insert({
    campaign_id: args.campaignId,
    entity_type: args.entityType,
    entity_id: args.entityId,
    kind: args.kind,
    path,
    size_bytes: blob.size,
    mime,
  }).select().single();
  if (error) {
    await sb.storage.from(MEDIA_BUCKET).remove([path]); // não deixa arquivo sem vínculo ocupando cota
    throw error;
  }
  return data as MediaRow;
}

// URLs assinadas ficam válidas por 1h; guardamos em memória para não pedir de novo a cada render.
const URL_TTL_SECONDS = 3600;
const urlCache = new Map<string, { url: string; exp: number }>();

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const sb = requireClient();
  const now = Date.now();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const p of paths) {
    const c = urlCache.get(p);
    if (c && c.exp > now + 60_000) out[p] = c.url;
    else missing.push(p);
  }
  if (missing.length) {
    const { data, error } = await sb.storage.from(MEDIA_BUCKET).createSignedUrls(missing, URL_TTL_SECONDS);
    if (error) throw error;
    for (const item of data || []) {
      if (item.signedUrl && item.path) {
        urlCache.set(item.path, { url: item.signedUrl, exp: now + URL_TTL_SECONDS * 1000 });
        out[item.path] = item.signedUrl;
      }
    }
  }
  return out;
}

async function removeObjects(paths: string[]) {
  const sb = requireClient();
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await sb.storage.from(MEDIA_BUCKET).remove(batch);
    if (error) throw error;
    batch.forEach((p) => urlCache.delete(p));
  }
}

/** Apaga primeiro o arquivo (que ocupa cota) e depois o vínculo. */
export async function deleteMedia(row: Pick<MediaRow, 'id' | 'path'>): Promise<void> {
  const sb = requireClient();
  await removeObjects([row.path]);
  const { error } = await sb.from('dmos_media').delete().eq('id', row.id);
  if (error) throw error;
}

async function deleteRows(rows: MediaRow[]) {
  if (!rows.length) return;
  const sb = requireClient();
  await removeObjects(rows.map((r) => r.path));
  const { error } = await sb.from('dmos_media').delete().in('id', rows.map((r) => r.id));
  if (error) throw error;
}

export async function deleteMediaForEntity(entityType: MediaEntity, entityId: string): Promise<void> {
  const sb = requireClient();
  const { data, error } = await sb.from('dmos_media').select('*').eq('entity_type', entityType).eq('entity_id', entityId);
  if (error) throw error;
  await deleteRows((data || []) as MediaRow[]);
}

export async function deleteMediaForCampaign(campaignId: string): Promise<void> {
  const sb = requireClient();
  const { data, error } = await sb.from('dmos_media').select('*').eq('campaign_id', campaignId);
  if (error) throw error;
  await deleteRows((data || []) as MediaRow[]);
}

export async function deleteAllMyMedia(): Promise<void> {
  const sb = requireClient();
  const { data, error } = await sb.from('dmos_media').select('*');
  if (error) throw error;
  await deleteRows((data || []) as MediaRow[]);
}
