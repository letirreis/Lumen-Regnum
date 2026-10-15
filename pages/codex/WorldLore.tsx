import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const WorldLore: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();
  const { t, opt } = useI18n();

  const updateWorldLore = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      world_lore: {
        ...codex.world_lore,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.worldLore.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.worldLore.subtitle')}</p>
        </div>
        <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <Card>
        <Textarea
          label={t('codex.worldLore.overview.label')}
          placeholder={t('codex.worldLore.overview.placeholder')}
          value={codex.world_lore.overview || ''}
          onChange={(e) => updateWorldLore('overview', e.target.value)}
          rows={6}
        />

        <Textarea
          label={t('codex.worldLore.history.label')}
          placeholder={t('codex.worldLore.history.placeholder')}
          value={codex.world_lore.history_highlights || ''}
          onChange={(e) => updateWorldLore('history_highlights', e.target.value)}
          rows={6}
        />

        <Textarea
          label={t('codex.worldLore.races.label')}
          placeholder={t('codex.worldLore.races.placeholder')}
          value={codex.world_lore.races_cultures || ''}
          onChange={(e) => updateWorldLore('races_cultures', e.target.value)}
          rows={6}
        />

        <Textarea
          label={t('codex.worldLore.religion.label')}
          placeholder={t('codex.worldLore.religion.placeholder')}
          value={codex.world_lore.religion_cosmology || ''}
          onChange={(e) => updateWorldLore('religion_cosmology', e.target.value)}
          rows={6}
        />
      </Card>
    </div>
  );
};
