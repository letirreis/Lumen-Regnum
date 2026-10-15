import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const ToneAesthetic: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();
  const { t, opt } = useI18n();

  const updateToneAesthetic = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      tone_and_aesthetic: {
        ...codex.tone_and_aesthetic,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.tone.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.tone.subtitle')}</p>
        </div>
        <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <Card>
        <Textarea
          label={t('codex.tone.emotional.label')}
          placeholder={t('codex.tone.emotional.placeholder')}
          value={codex.tone_and_aesthetic.emotional_palette || ''}
          onChange={(e) => updateToneAesthetic('emotional_palette', e.target.value)}
          rows={5}
        />

        <Textarea
          label={t('codex.tone.inspirations.label')}
          placeholder={t('codex.tone.inspirations.placeholder')}
          value={codex.tone_and_aesthetic.inspirations || ''}
          onChange={(e) => updateToneAesthetic('inspirations', e.target.value)}
          rows={5}
        />

        <Textarea
          label={t('codex.tone.pacing.label')}
          placeholder={t('codex.tone.pacing.placeholder')}
          value={codex.tone_and_aesthetic.pacing || ''}
          onChange={(e) => updateToneAesthetic('pacing', e.target.value)}
          rows={5}
        />

        <Textarea
          label={t('codex.tone.limits.label')}
          placeholder={t('codex.tone.limits.placeholder')}
          value={codex.tone_and_aesthetic.hard_limits || ''}
          onChange={(e) => updateToneAesthetic('hard_limits', e.target.value)}
          rows={5}
        />
      </Card>
    </div>
  );
};
