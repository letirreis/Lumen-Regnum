import React, { useState } from 'react';
import { generateId } from '../../services/store';
import { Card, Button, Input, Textarea, Modal, ConfirmModal } from '../../components/ui';
import { EyeOff, Plus, Trash2, Edit2 } from 'lucide-react';
import { WorldSecret } from '../../types';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

const STATUSES: WorldSecret['status'][] = ['Hidden', 'Hinted', 'Revealed'];

const statusColors: Record<WorldSecret['status'], string> = {
  Hidden: 'bg-red-950/20 text-red-400 border-red-900/40',
  Hinted: 'bg-yellow-900/20 text-yellow-400 border-yellow-900/40',
  Revealed: 'bg-green-900/20 text-green-400 border-green-900/40',
};

export const Secrets: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex, persist } = useCodexSection();
  const { t, opt } = useI18n();
  const [editing, setEditing] = useState<WorldSecret | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (loading) return <CodexLoading />;
  if (!codex) return <CodexMissing error={error} onCreate={handleCreateCodex} />;

  const secrets = codex.world_secrets ?? [];

  const saveSecret = async () => {
    if (!editing) return;
    const exists = secrets.some(s => s.id === editing.id);
    const next = exists ? secrets.map(s => (s.id === editing.id ? editing : s)) : [...secrets, editing];
    setIsSaving(true);
    const ok = await persist({ ...codex, world_secrets: next });
    setIsSaving(false);
    if (ok) setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    await persist({ ...codex, world_secrets: secrets.filter(s => s.id !== deleteId) });
    setIsSaving(false);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.secrets.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.secrets.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing({ id: generateId(), title: '', truth: '', clues: '', status: 'Hidden' })}>
            <Plus className="w-4 h-4 mr-2" /> {t('codex.secrets.add')}
          </Button>
          <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </div>

      <div className="flex items-center gap-2 pb-3 border-b border-red-900/30">
        <EyeOff className="w-5 h-5 text-red-400" />
        <span className="text-sm text-red-400 font-cinzel font-semibold">{t('codex.secrets.banner')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {secrets.length === 0 ? (
          <Card>
            <div className="text-center text-zinc-500 py-10">{t('codex.secrets.empty')}</div>
          </Card>
        ) : (
          secrets.map(secret => (
            <Card key={secret.id}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-cinzel font-bold text-violet-light mb-2">{secret.title || t('codex.secrets.untitled')}</h3>
                  <span className={`text-xs px-2 py-1 rounded border ${statusColors[secret.status] ?? statusColors.Hidden}`}>
                    {opt('secret_status', secret.status)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ ...secret })} aria-label={t('codex.secrets.editAria', { title: secret.title })} className="text-zinc-400 hover:text-gold transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(secret.id)} aria-label={t('codex.secrets.deleteAria', { title: secret.title })} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {secret.truth && <p className="text-sm text-zinc-300 mb-2 whitespace-pre-wrap">{secret.truth}</p>}
              {secret.clues && (
                <p className="text-xs text-zinc-500 whitespace-pre-wrap">
                  <span className="text-gold">{t('codex.secrets.clues')}:</span> {secret.clues}
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      <Card>
        <Textarea
          label={t('codex.secrets.world.label')}
          placeholder={t('codex.secrets.world.placeholder')}
          value={codex.secrets_of_world || ''}
          onChange={(e) => setCodex({ ...codex, secrets_of_world: e.target.value })}
          rows={8}
        />
      </Card>

      <Modal isOpen={!!editing} onClose={() => !isSaving && setEditing(null)} title={editing && secrets.some(s => s.id === editing.id) ? t('codex.secrets.editTitle') : t('codex.secrets.newTitle')}>
        {editing && (
          <>
            <Input label={t('codex.secrets.name')} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder={t('codex.secrets.namePlaceholder')} autoFocus />
            <Textarea label={t('codex.secrets.truth')} value={editing.truth} onChange={e => setEditing({ ...editing, truth: e.target.value })} placeholder={t('codex.secrets.truthPlaceholder')} rows={4} />
            <Textarea label={t('codex.secrets.cluesLabel')} value={editing.clues} onChange={e => setEditing({ ...editing, clues: e.target.value })} placeholder={t('codex.secrets.cluesPlaceholder')} rows={3} />
            <div className="mb-4">
              <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">{t('codex.secrets.status')}</label>
              <select
                value={editing.status}
                onChange={e => setEditing({ ...editing, status: e.target.value as WorldSecret['status'] })}
                className="flex h-10 w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
              >
                {STATUSES.map(s => <option key={s} value={s}>{opt('secret_status', s)}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={isSaving}>{t('common.cancel')}</Button>
              <Button onClick={saveSecret} disabled={isSaving}>{isSaving ? t('common.saving') : t('codex.secrets.save')}</Button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => !isSaving && setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('codex.secrets.deleteTitle')}
        message={isSaving ? t('common.deleting') : t('codex.secrets.deleteMessage')}
      />
    </div>
  );
};
