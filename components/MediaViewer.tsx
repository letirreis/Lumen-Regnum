import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { useI18n } from '../i18n';

export interface ViewerItem {
  url: string;
  title: string;
  subtitle?: string;
}

interface Props {
  items: ViewerItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

/** Visualizador em tela cheia: setas do teclado, Esc para fechar, clique fora fecha. */
export const MediaViewer: React.FC<Props> = ({ items, index, onIndex, onClose }) => {
  const { t } = useI18n();
  const item = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation(); // não fecha também o formulário que está por baixo
        onClose();
      } else if (e.key === 'ArrowRight' && index < items.length - 1) onIndex(index + 1);
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [index, items.length, onIndex, onClose]);

  if (!item) return null;
  const btn = 'p-2 rounded bg-zinc-900/80 text-zinc-200 hover:text-gold border border-gold/20';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[60] bg-black/90 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <div className="text-zinc-100 font-bold truncate">{item.title}</div>
          {item.subtitle && <div className="text-xs text-zinc-400 truncate">{item.subtitle}</div>}
        </div>
        <div className="flex gap-2 shrink-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className={btn} aria-label={t('viewer.openTab')}>
            <ExternalLink className="w-5 h-5" />
          </a>
          <button type="button" className={btn} onClick={onClose} aria-label={t('viewer.close')} autoFocus>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center p-3">
        {index > 0 && (
          <button type="button" className={`${btn} absolute left-3 z-10`} aria-label={t('viewer.prev')}
            onClick={(e) => { e.stopPropagation(); onIndex(index - 1); }}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <img
          src={item.url}
          alt={item.title}
          className="max-w-full max-h-full object-contain rounded"
          onClick={(e) => e.stopPropagation()}
        />
        {index < items.length - 1 && (
          <button type="button" className={`${btn} absolute right-3 z-10`} aria-label={t('viewer.next')}
            onClick={(e) => { e.stopPropagation(); onIndex(index + 1); }}>
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
      {items.length > 1 && <div className="text-center text-xs text-zinc-500 pb-3">{index + 1} / {items.length}</div>}
    </div>
  );
};
