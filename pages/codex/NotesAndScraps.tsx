import React from 'react';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle, FileText } from 'lucide-react';
import { useCodexSection } from './useCodexSection';

export const NotesAndScraps: React.FC = () => {
  const { codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex } = useCodexSection();

  const updateNotes = (value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      notes_and_scraps: value,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">Notes & Scraps</h1>
          <p className="text-zinc-400 text-sm">Freeform notes, ideas, and random thoughts</p>
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
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gold/10">
          <FileText className="w-5 h-5 text-gold" />
          <span className="text-sm text-gold font-cinzel font-semibold">
            Scratch Pad - No Structure Required
          </span>
        </div>
        
        <Textarea
          label="Notes & Ideas"
          placeholder="Use this space for any notes, ideas, or random thoughts about your campaign...

This is your scratch pad. Write freely without any structure. Great for:
• Quick ideas that come to mind
• Session prep notes
• Plot hooks to develop later
• Character ideas
• Cool scenes you want to run
• Random thoughts about the world
• Links and references
• Anything else!"
          value={codex.notes_and_scraps || ''}
          onChange={(e) => updateNotes(e.target.value)}
          rows={20}
        />
      </Card>
    </div>
  );
};
