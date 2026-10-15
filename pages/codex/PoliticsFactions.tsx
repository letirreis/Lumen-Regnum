import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const PoliticsFactions: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();
  const { t, opt } = useI18n();

  const updatePoliticsFactions = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      politics_and_factions: {
        ...codex.politics_and_factions,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.politics.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.politics.subtitle')}</p>
        </div>
        <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <Card>
        <Textarea
          label={t('codex.politics.landscape.label')}
          placeholder={t('codex.politics.landscape.placeholder')}
          value={codex.politics_and_factions.political_landscape || ''}
          onChange={(e) => updatePoliticsFactions('political_landscape', e.target.value)}
          rows={6}
        />

        <Textarea
          label={t('codex.politics.powers.label')}
          placeholder={t('codex.politics.powers.placeholder')}
          value={codex.politics_and_factions.major_powers || ''}
          onChange={(e) => updatePoliticsFactions('major_powers', e.target.value)}
          rows={6}
        />

        <Textarea
          label={t('codex.politics.tensions.label')}
          placeholder={t('codex.politics.tensions.placeholder')}
          value={codex.politics_and_factions.tensions_conflicts || ''}
          onChange={(e) => updatePoliticsFactions('tensions_conflicts', e.target.value)}
          rows={6}
        />
      </Card>
    </div>
  );
};
