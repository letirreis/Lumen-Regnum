import React from 'react';
import { Button } from '../../components/ui';
import { Save, CheckCircle } from 'lucide-react';
import { useI18n } from '../../i18n';

// Pedaços repetidos em todas as páginas do Códex (carregando, códex ausente, botão de salvar).

export const CodexLoading: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gold animate-pulse">{t('common.loading')}</div>
    </div>
  );
};

export const CodexMissing: React.FC<{ error: string | null; onCreate: () => void }> = ({ error, onCreate }) => {
  const { t } = useI18n();
  return (
    <div className="text-center py-12">
      <p className="text-zinc-500 mb-4">{t('codex.missing')}</p>
      {error && (
        <div className="mb-4 p-4 bg-red-950/30 border border-red-900/50 rounded text-red-400 text-sm max-w-md mx-auto">
          {error}
        </div>
      )}
      <Button onClick={onCreate}>{t('codex.create')}</Button>
    </div>
  );
};

export const CodexSaveButton: React.FC<{ saving: boolean; saved: boolean; onClick: () => void }> = ({ saving, saved, onClick }) => {
  const { t } = useI18n();
  return (
    <Button onClick={onClick} disabled={saving} className="min-w-[100px]">
      {saving ? (
        <>{t('common.saving')}</>
      ) : saved ? (
        <><CheckCircle className="w-4 h-4 mr-2" /> {t('common.saved')}</>
      ) : (
        <><Save className="w-4 h-4 mr-2" /> {t('common.save')}</>
      )}
    </Button>
  );
};
