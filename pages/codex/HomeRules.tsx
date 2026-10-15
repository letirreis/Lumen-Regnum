import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { BookOpen } from 'lucide-react';
import { useCodexSection } from './useCodexSection';
import { CodexLoading, CodexMissing, CodexSaveButton } from './CodexParts';
import { useI18n } from '../../i18n';

export const HomeRules: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();
  const { t, opt } = useI18n();

  const updateHomeRules = (value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      home_rules: value,
    });
  };

  if (loading) return <CodexLoading />;

  if (!codex) return <CodexMissing error={error} onCreate={handleCreateCodex} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">{t('codex.homeRules.title')}</h1>
          <p className="text-zinc-400 text-sm">{t('codex.homeRules.subtitle')}</p>
        </div>
        <CodexSaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-violet/20">
          <BookOpen className="w-5 h-5 text-violet-light" />
          <span className="text-sm text-violet-light font-cinzel font-semibold">
            {t('codex.homeRules.banner')}
          </span>
        </div>
        
        <Textarea
          label={t('codex.homeRules.label')}
          placeholder={t('codex.homeRules.placeholder')}
          value={codex.home_rules || ''}
          onChange={(e) => updateHomeRules(e.target.value)}
          rows={20}
        />
      </Card>
    </div>
  );
};
