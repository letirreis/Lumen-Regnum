import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const MagicTech: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();
  const { t, opt } = useI18n();

  const updateMagicTech = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      magic_and_technology: {
        ...codex.magic_and_technology,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.magicTech.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.magicTech.subtitle')}</p>
        </div>
        <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <Card>
        <Textarea
          label={t('codex.magicTech.nature.label')}
          placeholder={t('codex.magicTech.nature.placeholder')}
          value={codex.magic_and_technology.magic_nature || ''}
          onChange={(e) => updateMagicTech('magic_nature', e.target.value)}
          rows={6}
        />

        <Textarea
          label={t('codex.magicTech.commonality.label')}
          placeholder={t('codex.magicTech.commonality.placeholder')}
          value={codex.magic_and_technology.magic_commonality || ''}
          onChange={(e) => updateMagicTech('magic_commonality', e.target.value)}
          rows={4}
        />

        <Textarea
          label={t('codex.magicTech.costs.label')}
          placeholder={t('codex.magicTech.costs.placeholder')}
          value={codex.magic_and_technology.costs_risks || ''}
          onChange={(e) => updateMagicTech('costs_risks', e.target.value)}
          rows={4}
        />

        <Textarea
          label={t('codex.magicTech.techLevel.label')}
          placeholder={t('codex.magicTech.techLevel.placeholder')}
          value={codex.magic_and_technology.technology_level || ''}
          onChange={(e) => updateMagicTech('technology_level', e.target.value)}
          rows={4}
        />
      </Card>
    </div>
  );
};
