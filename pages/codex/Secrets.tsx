import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { EyeOff } from 'lucide-react';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const Secrets: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();
  const { t, opt } = useI18n();

  const updateSecrets = (value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      secrets_of_world: value,
    });
  };

  if (loading) return <CodexLoading />;

  if (!codex) return <CodexMissing error={error} onCreate={handleCreateCodex} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.secrets.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.secrets.subtitle')}</p>
        </div>
        <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-900/30">
          <EyeOff className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400 font-cinzel font-semibold">
            {t('codex.secrets.banner')}
          </span>
        </div>
        
        <Textarea
          label={t('codex.secrets.world.label')}
          placeholder={t('codex.secrets.world.placeholder')}
          value={codex.secrets_of_world || ''}
          onChange={(e) => updateSecrets(e.target.value)}
          rows={15}
        />
      </Card>
    </div>
  );
};
