import React, { useState } from 'react';
import { generateId } from '../../services/store';
import { Card, Button, Input, Textarea, Modal, ConfirmModal } from '../../components/ui';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const WorldTimeline: React.FC = () => {
  const { codex, saving, saved, loading, error, handleSave, handleCreateCodex, persist } = useCodexSection();
  const { t } = useI18n();
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openNewEvent = () => {
    setEditingEvent({
      id: generateId(),
      event_name: '',
      era_date: '',
      description: '',
      impact: '',
    });
    setModalOpen(true);
  };

  const openEditEvent = (event: any) => {
    setEditingEvent({ ...event });
    setModalOpen(true);
  };

  const saveEvent = async () => {
    if (!editingEvent || !codex) return;

    const existingIndex = codex.world_timeline.findIndex((e) => e.id === editingEvent.id);
    let updatedTimeline;

    if (existingIndex >= 0) {
      updatedTimeline = [...codex.world_timeline];
      updatedTimeline[existingIndex] = editingEvent;
    } else {
      updatedTimeline = [...codex.world_timeline, editingEvent];
    }

    setIsSaving(true);
    const ok = await persist({ ...codex, world_timeline: updatedTimeline });
    setIsSaving(false);
    if (!ok) return;
    setModalOpen(false);
    setEditingEvent(null);
  };

  const confirmDeleteEvent = async () => {
    if (!deleteEventId || !codex) return;
    const updatedTimeline = codex.world_timeline.filter((e) => e.id !== deleteEventId);
    setIsSaving(true);
    await persist({ ...codex, world_timeline: updatedTimeline });
    setIsSaving(false);
    setDeleteEventId(null);
  };

  if (loading) return <CodexLoading />;

  if (!codex) return <CodexMissing error={error} onCreate={handleCreateCodex} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.timeline.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.timeline.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewEvent} variant="secondary">
            <Plus className="w-4 h-4 mr-2" /> {t('codex.timeline.add')}
          </Button>
          <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </div>

      <div className="space-y-4">
        {codex.world_timeline.length === 0 ? (
          <Card>
            <div className="text-center text-zinc-500 py-12">
              {t('codex.timeline.empty')}
            </div>
          </Card>
        ) : (
          codex.world_timeline.map((event) => (
            <Card key={event.id}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="w-5 h-5 text-violet-light" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-cinzel font-bold text-violet-light mb-1">{event.event_name}</h3>
                      {event.era_date && (
                        <span className="text-xs text-gold font-cinzel tracking-wide">{event.era_date}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditEvent(event)}
                        className="text-zinc-400 hover:text-gold transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteEventId(event.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 mb-2">{event.description}</p>
                  {event.impact && (
                    <div className="mt-2 pt-2 border-t border-gold/10">
                      <p className="text-xs text-zinc-500">
                        <span className="text-gold">{t('codex.timeline.impact')}:</span> {event.impact}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent?.event_name ? t('codex.timeline.editTitle') : t('codex.timeline.newTitle')}
      >
        {editingEvent && (
          <>
            <Input
              label={t('codex.timeline.name')}
              value={editingEvent.event_name}
              onChange={(e) => setEditingEvent({ ...editingEvent, event_name: e.target.value })}
              placeholder={t('codex.timeline.namePlaceholder')}
              autoFocus
            />
            <Input
              label={t('codex.timeline.era')}
              value={editingEvent.era_date}
              onChange={(e) => setEditingEvent({ ...editingEvent, era_date: e.target.value })}
              placeholder={t('codex.timeline.eraPlaceholder')}
            />
            <Textarea
              label={t('common.description')}
              value={editingEvent.description}
              onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
              placeholder={t('codex.timeline.descriptionPlaceholder')}
              rows={5}
            />
            <Textarea
              label={t('codex.timeline.impactLabel')}
              value={editingEvent.impact}
              onChange={(e) => setEditingEvent({ ...editingEvent, impact: e.target.value })}
              placeholder={t('codex.timeline.impactPlaceholder')}
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={saveEvent} disabled={isSaving}>{isSaving ? t('common.saving') : t('codex.timeline.save')}</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteEventId}
        onClose={() => !isSaving && setDeleteEventId(null)}
        onConfirm={confirmDeleteEvent}
        title={t('codex.timeline.deleteTitle')}
        message={isSaving ? t('common.deleting') : t('codex.timeline.deleteMessage')}
      />
    </div>
  );
};
