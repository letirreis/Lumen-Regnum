import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Lock, Trash2 } from 'lucide-react';
import { Button } from './ui';
import { useToast } from './Toast';
import { useI18n } from '../i18n';
import { translateDbError } from '../i18n/dbErrors';
import { fetchMyPlan } from '../services/plan';
import {
  MediaEntity, MediaInputError, MediaRow, deleteMedia, listMedia, signedUrls, uploadMedia,
} from '../services/media';

interface Props {
  campaignId: string;
  entityType: MediaEntity;
  entityId: string;
  entityName?: string;
  allowMaps?: boolean;
  onChanged?: () => void; // avisa a lista para atualizar as miniaturas
}

export const EntityMedia: React.FC<Props> = ({ campaignId, entityType, entityId, entityName, allowMaps, onChanged }) => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [canUpload, setCanUpload] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const portraitInput = useRef<HTMLInputElement>(null);
  const mapInput = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      const list = await listMedia(campaignId, entityType, entityId);
      setRows(list);
      setUrls(list.length ? await signedUrls(list.map((r) => r.path)) : {});
    } catch (e) {
      console.error('Error loading media', e);
    }
  }, [campaignId, entityType, entityId]);

  useEffect(() => {
    reload();
    // O cadeado é só aviso visual; quem barra o envio de verdade é o servidor.
    fetchMyPlan().then((p) => setCanUpload(!!p.features.images)).catch(() => setCanUpload(null));
  }, [reload]);

  const portrait = rows.find((r) => r.kind === 'portrait');
  const maps = rows.filter((r) => r.kind === 'map');

  const errorText = (e: unknown): string => {
    if (e instanceof MediaInputError) {
      return t(e.code === 'type' ? 'media.invalidType' : e.code === 'size' ? 'media.tooBig' : 'media.processingError');
    }
    const msg = (e as { message?: string })?.message;
    return translateDbError(msg) || msg || t('common.unknownError');
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'portrait' | 'map') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      if (kind === 'portrait' && portrait) await deleteMedia(portrait); // um retrato por ficha: troca o anterior
      await uploadMedia({ campaignId, entityType, entityId, kind, file });
      await reload();
      onChanged?.();
    } catch (err) {
      showToast(t('media.error', { detail: errorText(err) }), 'error');
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (row: MediaRow) => {
    setBusy(true);
    try {
      await deleteMedia(row);
      await reload();
      onChanged?.();
    } catch (err) {
      showToast(t('media.removeError', { detail: errorText(err) }), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (canUpload === false && rows.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-silver/50 border border-gold/10 rounded p-3">
        <Lock className="w-4 h-4" aria-hidden="true" /> {t('media.locked')}
      </div>
    );
  }

  const accept = 'image/jpeg,image/png,image/webp';
  return (
    <div className="space-y-3 border border-gold/10 rounded p-3">
      <div>
        <div className="text-sm text-silver/80 mb-2">{t('media.title')}</div>
        <div className="flex items-center gap-3 flex-wrap">
          {portrait && urls[portrait.path] ? (
            <img src={urls[portrait.path]} alt={entityName || t('media.title')} className="w-24 h-24 object-cover rounded border border-gold/20" />
          ) : (
            <div className="w-24 h-24 rounded border border-dashed border-gold/20 flex items-center justify-center text-silver/30">
              <ImagePlus className="w-6 h-6" aria-hidden="true" />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <input ref={portraitInput} type="file" accept={accept} className="hidden" onChange={(e) => onPick(e, 'portrait')} />
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => portraitInput.current?.click()}>
              {busy ? t('media.uploading') : portrait ? t('media.replace') : t('media.upload')}
            </Button>
            {portrait && (
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onRemove(portrait)}>
                <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" /> {t('media.remove')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {allowMaps && (
        <div>
          <div className="text-sm text-silver/80 mb-2">{t('media.maps')}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {maps.map((m) => (
              <div key={m.id} className="relative group">
                {urls[m.path] && <img src={urls[m.path]} alt={t('media.maps')} className="w-full h-24 object-cover rounded border border-gold/20" />}
                <button
                  type="button"
                  aria-label={t('media.remove')}
                  disabled={busy}
                  onClick={() => onRemove(m)}
                  className="absolute top-1 right-1 p-1 bg-zinc-900/90 rounded text-zinc-300 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <input ref={mapInput} type="file" accept={accept} className="hidden" onChange={(e) => onPick(e, 'map')} />
          <Button type="button" variant="secondary" size="sm" className="mt-2" disabled={busy || maps.length >= 6} onClick={() => mapInput.current?.click()}>
            {t('media.addMap')}
          </Button>
        </div>
      )}
    </div>
  );
};
