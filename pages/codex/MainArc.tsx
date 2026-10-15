import React from 'react';
import { Card, Button, Input, Textarea } from '../../components/ui';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const MainArc: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();
  const { t, opt } = useI18n();

  const updateMainArc = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      main_arc: {
        ...codex.main_arc,
        [field]: value,
      },
    });
  };

  if (loading) return <CodexLoading />;

  if (!codex) return <CodexMissing error={error} onCreate={handleCreateCodex} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.mainArc.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.mainArc.subtitle')}</p>
        </div>
        <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <Card>
        <Textarea
          label={t('codex.mainArc.premise.label')}
          placeholder={t('codex.mainArc.premise.placeholder')}
          value={codex.main_arc.premise || ''}
          onChange={(e) => updateMainArc('premise', e.target.value)}
          rows={6}
        />

        <Textarea
          label={t('codex.mainArc.coreConflict.label')}
          placeholder={t('codex.mainArc.coreConflict.placeholder')}
          value={codex.main_arc.core_conflict || ''}
          onChange={(e) => updateMainArc('core_conflict', e.target.value)}
          rows={4}
        />

        <Textarea
          label={t('codex.mainArc.antagonist.label')}
          placeholder={t('codex.mainArc.antagonist.placeholder')}
          value={codex.main_arc.primary_antagonist || ''}
          onChange={(e) => updateMainArc('primary_antagonist', e.target.value)}
          rows={4}
        />

        <Input
          label={t('codex.mainArc.themes.label')}
          placeholder={t('codex.mainArc.themes.placeholder')}
          value={codex.main_arc.themes || ''}
          onChange={(e) => updateMainArc('themes', e.target.value)}
        />

        <div className="mb-4">
          <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
            {t('codex.mainArc.arcStatus')}
          </label>
          <select
            value={codex.main_arc.arc_status || 'Beginning'}
            onChange={(e) => updateMainArc('arc_status', e.target.value)}
            className="flex h-10 w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
          >
            <option value="Beginning">{opt('arc_status', 'Beginning')}</option>
            <option value="Rising Conflict">{opt('arc_status', 'Rising Conflict')}</option>
            <option value="Climax">{opt('arc_status', 'Climax')}</option>
            <option value="Resolution">{opt('arc_status', 'Resolution')}</option>
          </select>
        </div>

        <Textarea
          label={t('codex.mainArc.finalGoal.label')}
          placeholder={t('codex.mainArc.finalGoal.placeholder')}
          value={codex.main_arc.final_goal || ''}
          onChange={(e) => updateMainArc('final_goal', e.target.value)}
          rows={4}
        />
      </Card>
    </div>
  );
};
