import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Image as ImageIcon, Search } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { MediaViewer } from '../components/MediaViewer';
import { useI18n } from '../i18n';
import { db } from '../services/store';
import { MediaEntity, MediaKind, MediaRow, listMedia, signedUrls } from '../services/media';

const PAGE = 48;
const ENTITY_ORDER: MediaEntity[] = ['character', 'npc', 'monster', 'location', 'faction', 'item'];
const NAV_KEY: Record<MediaEntity, string> = {
  character: 'nav.characters', npc: 'nav.npcs', monster: 'nav.monsters',
  location: 'nav.locations', faction: 'nav.factions', item: 'nav.items',
};
const ROUTE: Record<MediaEntity, string> = {
  character: 'characters', npc: 'npcs', monster: 'monsters', location: 'locations', faction: 'factions', item: 'items',
};
const LISTERS: Record<MediaEntity, (id: string) => Promise<any[]>> = {
  character: (id) => db.characters.list(id), npc: (id) => db.npcs.list(id), monster: (id) => db.monsters.list(id),
  location: (id) => db.locations.list(id), faction: (id) => db.factions.list(id), item: (id) => db.items.list(id),
};

export const Gallery: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState<'' | MediaKind>('');
  const [type, setType] = useState<'' | MediaEntity>('');
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [viewIdx, setViewIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await listMedia(campaignId);
        const types = Array.from(new Set(list.map((r) => r.entity_type)));
        const lists = await Promise.all(types.map((ty) => LISTERS[ty](campaignId).catch(() => [])));
        const map: Record<string, string> = {};
        lists.forEach((l) => l.forEach((e: any) => { map[e.id] = e.name || ''; }));
        if (cancelled) return;
        setRows(list);
        setNames(map);
      } catch (e) {
        console.error('Error loading gallery', e);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [campaignId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => (!kind || r.kind === kind) && (!type || r.entity_type === type))
      .filter((r) => !q || (names[r.entity_id] || '').toLowerCase().includes(q))
      // mapas primeiro; depois por tipo de ficha e nome
      .sort((a, b) =>
        (a.kind === b.kind ? 0 : a.kind === 'map' ? -1 : 1) ||
        ENTITY_ORDER.indexOf(a.entity_type) - ENTITY_ORDER.indexOf(b.entity_type) ||
        (names[a.entity_id] || '').localeCompare(names[b.entity_id] || ''));
  }, [rows, kind, type, search, names]);

  const visible = filtered.slice(0, shown);

  useEffect(() => { setShown(PAGE); }, [kind, type, search]);

  useEffect(() => {
    const missing = visible.filter((r) => !urls[r.path]).map((r) => r.path);
    if (!missing.length) return;
    signedUrls(missing).then((u) => setUrls((prev) => ({ ...prev, ...u }))).catch((e) => console.error('Error signing urls', e));
  }, [visible, urls]);

  const counts = useMemo(() => ({
    all: rows.length,
    portrait: rows.filter((r) => r.kind === 'portrait').length,
    map: rows.filter((r) => r.kind === 'map').length,
  }), [rows]);

  const typesPresent = ENTITY_ORDER.filter((ty) => rows.some((r) => r.entity_type === ty));
  const viewable = visible.filter((r) => urls[r.path]);
  const title = (r: MediaRow) => names[r.entity_id] || t(NAV_KEY[r.entity_type] as any);
  const sub = (r: MediaRow) => `${t(r.kind === 'map' ? 'media.kind.map' : 'media.kind.portrait')} · ${t(NAV_KEY[r.entity_type] as any)}`;

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded border text-xs uppercase font-bold tracking-wider transition-colors ${
      active ? 'bg-gold/15 border-gold/60 text-gold' : 'border-gold/20 text-silver/70 hover:border-gold/40'}`;

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-zinc-100">{t('gallery.title')}</h1>

      {loading ? (
        <p className="text-silver/60">{t('common.loading')}</p>
      ) : failed ? (
        <p className="text-red-300">{t('gallery.loadError')}</p>
      ) : rows.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <ImageIcon className="w-10 h-10 mx-auto text-silver/30" aria-hidden="true" />
          <p className="text-silver/70 max-w-md mx-auto">{t('gallery.empty')}</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            {(['', 'map', 'portrait'] as const).map((k) => (
              <button key={k || 'all'} type="button" className={chip(kind === k)} aria-pressed={kind === k} onClick={() => setKind(k)}>
                {t(k === '' ? 'gallery.kind.all' : k === 'map' ? 'gallery.kind.map' : 'gallery.kind.portrait')} ({k === '' ? counts.all : counts[k]})
              </button>
            ))}
            <select
              aria-label={t('gallery.allTypes')}
              value={type}
              onChange={(e) => setType(e.target.value as '' | MediaEntity)}
              className="bg-black/60 border border-gold/20 rounded px-3 py-1.5 text-sm text-zinc-100"
            >
              <option value="">{t('gallery.allTypes')}</option>
              {typesPresent.map((ty) => <option key={ty} value={ty}>{t(NAV_KEY[ty] as any)}</option>)}
            </select>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-silver/40" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('gallery.search')}
                aria-label={t('gallery.search')}
                className="w-full bg-black/60 border border-gold/20 rounded pl-9 pr-3 py-1.5 text-sm text-zinc-100"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-silver/60">{t('gallery.noResults')}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {visible.map((r) => (
                  <div key={r.id} className="group border border-gold/15 rounded overflow-hidden bg-black/30 flex flex-col">
                    <button
                      type="button"
                      onClick={() => { const i = viewable.findIndex((v) => v.id === r.id); if (i >= 0) setViewIdx(i); }}
                      aria-label={`${t('viewer.open')}: ${title(r)}`}
                      className="aspect-square bg-black/50 flex items-center justify-center"
                    >
                      {urls[r.path] ? (
                        <img src={urls[r.path]} alt={title(r)} loading="lazy"
                          className={`w-full h-full ${r.kind === 'map' ? 'object-contain' : 'object-cover object-top'} group-hover:opacity-90`} />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-silver/20" aria-hidden="true" />
                      )}
                    </button>
                    <div className="p-2 space-y-1">
                      <div className="text-sm font-bold text-zinc-100 truncate">{title(r)}</div>
                      <div className="text-[11px] text-silver/60 truncate">{sub(r)}</div>
                      <button
                        type="button"
                        className="text-[11px] text-gold/80 hover:text-gold underline"
                        onClick={() => navigate(`/campaign/${campaignId}/${ROUTE[r.entity_type]}`)}
                      >
                        {t('gallery.openList')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filtered.length > shown && (
                <div className="text-center">
                  <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>{t('gallery.more')}</Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {viewIdx !== null && (
        <MediaViewer
          items={viewable.map((r) => ({ url: urls[r.path], title: title(r), subtitle: sub(r) }))}
          index={viewIdx}
          onIndex={setViewIdx}
          onClose={() => setViewIdx(null)}
        />
      )}
    </div>
  );
};

export default Gallery;
