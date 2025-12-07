import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, generateId } from '../../services/store';
import { CampaignCodex } from '../../types';
import { Card, Button, Input, Textarea, Modal, ConfirmModal } from '../../components/ui';
import { Save, CheckCircle, Plus, Trash2, Edit2, Clock } from 'lucide-react';

export const WorldTimeline: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const [codex, setCodex] = useState<CampaignCodex | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadCodex();
    }
  }, [campaignId]);

  const loadCodex = async () => {
    if (!campaignId) return;
    setLoading(true);
    const data = await db.codex.get(campaignId);
    if (data) {
      setCodex(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!codex) return;
    setSaving(true);
    setSaved(false);
    await db.codex.update(codex);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

  const saveEvent = () => {
    if (!editingEvent || !codex) return;

    const existingIndex = codex.world_timeline.findIndex((e) => e.id === editingEvent.id);
    let updatedTimeline;

    if (existingIndex >= 0) {
      updatedTimeline = [...codex.world_timeline];
      updatedTimeline[existingIndex] = editingEvent;
    } else {
      updatedTimeline = [...codex.world_timeline, editingEvent];
    }

    setCodex({ ...codex, world_timeline: updatedTimeline });
    setModalOpen(false);
    setEditingEvent(null);
  };

  const confirmDeleteEvent = () => {
    if (!deleteEventId || !codex) return;
    const updatedTimeline = codex.world_timeline.filter((e) => e.id !== deleteEventId);
    setCodex({ ...codex, world_timeline: updatedTimeline });
    setDeleteEventId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!codex) {
    return (
      <div className="text-center text-zinc-500 py-12">
        Failed to load codex data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">World Timeline</h1>
          <p className="text-zinc-400 text-sm">Chronicle major events throughout your world's history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewEvent} variant="secondary">
            <Plus className="w-4 h-4 mr-2" /> Add Event
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[100px]"
          >
            {saving ? (
              <>Saving...</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4 mr-2" /> Saved</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save</>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {codex.world_timeline.length === 0 ? (
          <Card>
            <div className="text-center text-zinc-500 py-12">
              No timeline events yet. Click "Add Event" to create your first historical event.
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
                        <span className="text-gold">Impact:</span> {event.impact}
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
        title={editingEvent?.event_name ? 'Edit Event' : 'New Timeline Event'}
      >
        {editingEvent && (
          <>
            <Input
              label="Event Name"
              value={editingEvent.event_name}
              onChange={(e) => setEditingEvent({ ...editingEvent, event_name: e.target.value })}
              placeholder="e.g., The Great Cataclysm"
              autoFocus
            />
            <Input
              label="Era / Date"
              value={editingEvent.era_date}
              onChange={(e) => setEditingEvent({ ...editingEvent, era_date: e.target.value })}
              placeholder="e.g., Year 1452, The Age of Dragons"
            />
            <Textarea
              label="Description"
              value={editingEvent.description}
              onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
              placeholder="What happened during this event?"
              rows={5}
            />
            <Textarea
              label="Impact on Campaign"
              value={editingEvent.impact}
              onChange={(e) => setEditingEvent({ ...editingEvent, impact: e.target.value })}
              placeholder="How does this event affect the current campaign?"
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEvent}>Save Event</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteEventId}
        onClose={() => setDeleteEventId(null)}
        onConfirm={confirmDeleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this timeline event? This action cannot be undone."
      />
    </div>
  );
};
