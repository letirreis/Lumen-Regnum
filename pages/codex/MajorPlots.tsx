import React, { useState } from 'react';
import { generateId } from '../../services/store';
import { Card, Button, Input, Textarea, Modal, ConfirmModal } from '../../components/ui';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const MajorPlots: React.FC = () => {
  const { codex, saving, saved, loading, error, handleSave, handleCreateCodex, persist } = useCodexSection();
  const { t, opt } = useI18n();
  const [editingPlot, setEditingPlot] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [deletePlotId, setDeletePlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openNewPlot = () => {
    setEditingPlot({
      id: generateId(),
      name: '',
      description: '',
      involved_npcs: '',
      involved_factions: '',
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEditPlot = (plot: any) => {
    setEditingPlot({ ...plot });
    setModalOpen(true);
  };

  const savePlot = async () => {
    if (!editingPlot || !codex) return;

    const existingIndex = codex.major_plots.findIndex((p) => p.id === editingPlot.id);
    let updatedPlots;

    if (existingIndex >= 0) {
      updatedPlots = [...codex.major_plots];
      updatedPlots[existingIndex] = editingPlot;
    } else {
      updatedPlots = [...codex.major_plots, editingPlot];
    }

    setIsSaving(true);
    const ok = await persist({ ...codex, major_plots: updatedPlots });
    setIsSaving(false);
    if (!ok) return;
    setModalOpen(false);
    setEditingPlot(null);
  };

  const confirmDeletePlot = async () => {
    if (!deletePlotId || !codex) return;
    const updatedPlots = codex.major_plots.filter((p) => p.id !== deletePlotId);
    setIsSaving(true);
    await persist({ ...codex, major_plots: updatedPlots });
    setIsSaving(false);
    setDeletePlotId(null);
  };

  if (loading) return <CodexLoading />;

  if (!codex) return <CodexMissing error={error} onCreate={handleCreateCodex} />;

  const statusColors: Record<string, string> = {
    Active: 'bg-green-900/20 text-green-400 border-green-900/40',
    Future: 'bg-blue-900/20 text-blue-400 border-blue-900/40',
    Resolved: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    Dropped: 'bg-red-950/20 text-red-400 border-red-900/40',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.majorPlots.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.majorPlots.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewPlot} variant="secondary">
            <Plus className="w-4 h-4 mr-2" /> {t('codex.majorPlots.add')}
          </Button>
          <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {codex.major_plots.length === 0 ? (
          <Card>
            <div className="text-center text-zinc-500 py-12">
              {t('codex.majorPlots.empty')}
            </div>
          </Card>
        ) : (
          codex.major_plots.map((plot) => (
            <Card key={plot.id}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-cinzel font-bold text-violet-light mb-2">{plot.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded border ${statusColors[plot.status]}`}>
                    {opt('plot_status', plot.status)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditPlot(plot)}
                    className="text-zinc-400 hover:text-gold transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletePlotId(plot.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-300 mb-3">{plot.description}</p>
              {plot.involved_npcs && (
                <p className="text-xs text-zinc-500 mb-1">
                  <span className="text-gold">{t('codex.majorPlots.npcs')}:</span> {plot.involved_npcs}
                </p>
              )}
              {plot.involved_factions && (
                <p className="text-xs text-zinc-500">
                  <span className="text-gold">{t('codex.majorPlots.factions')}:</span> {plot.involved_factions}
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Edit/Add Plot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPlot(null);
        }}
        title={editingPlot?.name ? t('codex.majorPlots.editTitle') : t('codex.majorPlots.newTitle')}
      >
        {editingPlot && (
          <>
            <Input
              label={t('codex.majorPlots.name')}
              value={editingPlot.name}
              onChange={(e) => setEditingPlot({ ...editingPlot, name: e.target.value })}
              placeholder={t('codex.majorPlots.namePlaceholder')}
              autoFocus
            />
            <Textarea
              label={t('common.description')}
              value={editingPlot.description}
              onChange={(e) => setEditingPlot({ ...editingPlot, description: e.target.value })}
              placeholder={t('codex.majorPlots.descriptionPlaceholder')}
              rows={4}
            />
            <Input
              label={t('codex.majorPlots.involvedNpcs')}
              value={editingPlot.involved_npcs}
              onChange={(e) => setEditingPlot({ ...editingPlot, involved_npcs: e.target.value })}
              placeholder={t('codex.majorPlots.involvedNpcsPlaceholder')}
            />
            <Input
              label={t('codex.majorPlots.involvedFactions')}
              value={editingPlot.involved_factions}
              onChange={(e) => setEditingPlot({ ...editingPlot, involved_factions: e.target.value })}
              placeholder={t('codex.majorPlots.involvedFactionsPlaceholder')}
            />
            <div className="mb-4">
              <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
                {t('codex.majorPlots.status')}
              </label>
              <select
                value={editingPlot.status}
                onChange={(e) => setEditingPlot({ ...editingPlot, status: e.target.value })}
                className="flex h-10 w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
              >
                <option value="Active">{opt('plot_status', 'Active')}</option>
                <option value="Future">{opt('plot_status', 'Future')}</option>
                <option value="Resolved">{opt('plot_status', 'Resolved')}</option>
                <option value="Dropped">{opt('plot_status', 'Dropped')}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={savePlot} disabled={isSaving}>{isSaving ? t('common.saving') : t('codex.majorPlots.save')}</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletePlotId}
        onClose={() => !isSaving && setDeletePlotId(null)}
        onConfirm={confirmDeletePlot}
        title={t('codex.majorPlots.deleteTitle')}
        message={isSaving ? t('common.deleting') : t('codex.majorPlots.deleteMessage')}
      />
    </div>
  );
};
