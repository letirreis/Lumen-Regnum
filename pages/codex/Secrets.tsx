import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle, EyeOff } from 'lucide-react';
import { useCodexSection } from './useCodexSection';

export const Secrets: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();

  const updateSecrets = (value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      secrets_of_world: value,
    });
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
      <div className="text-center py-12">
        <p className="text-zinc-500 mb-4">No codex data found for this campaign.</p>
        {error && (
          <div className="mb-4 p-4 bg-red-950/30 border border-red-900/50 rounded text-red-400 text-sm max-w-md mx-auto">
            {error}
          </div>
        )}
        <Button onClick={handleCreateCodex}>
          Create Codex
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">Secrets of the World</h1>
          <p className="text-zinc-400 text-sm">DM-only secrets, plot twists, and hidden truths</p>
        </div>
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

      <Card>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-900/30">
          <EyeOff className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400 font-cinzel font-semibold">
            DM Eyes Only - Keep your secrets safe
          </span>
        </div>
        
        <Textarea
          label="World Secrets"
          placeholder="Hidden truths, plot twists, secret histories, conspiracies, and revelations that players should not know..."
          value={codex.secrets_of_world || ''}
          onChange={(e) => updateSecrets(e.target.value)}
          rows={15}
        />
      </Card>
    </div>
  );
};
