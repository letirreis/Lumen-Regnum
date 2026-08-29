import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle } from 'lucide-react';
import { useCodexSection } from './useCodexSection';

export const WorldLore: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();

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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">World Lore</h1>
          <p className="text-zinc-400 text-sm">Document the history, cultures, and cosmology of your world</p>
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
        <Textarea
          label="World Overview"
          placeholder="A broad overview of the world, its nature, and what makes it unique..."
          value={codex.world_lore.overview || ''}
          onChange={(e) => updateWorldLore('overview', e.target.value)}
          rows={6}
        />

        <Textarea
          label="History Highlights"
          placeholder="Key historical events, ages, wars, or cataclysms that shaped the world..."
          value={codex.world_lore.history_highlights || ''}
          onChange={(e) => updateWorldLore('history_highlights', e.target.value)}
          rows={6}
        />

        <Textarea
          label="Races & Cultures"
          placeholder="Major races, cultures, and civilizations in your world..."
          value={codex.world_lore.races_cultures || ''}
          onChange={(e) => updateWorldLore('races_cultures', e.target.value)}
          rows={6}
        />

        <Textarea
          label="Religion & Cosmology"
          placeholder="Gods, pantheons, planes of existence, and spiritual beliefs..."
          value={codex.world_lore.religion_cosmology || ''}
          onChange={(e) => updateWorldLore('religion_cosmology', e.target.value)}
          rows={6}
        />
      </Card>
    </div>
  );
};
