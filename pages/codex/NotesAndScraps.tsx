import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/store';
import { CampaignCodex } from '../../types';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle, FileText } from 'lucide-react';

export const NotesAndScraps: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const [codex, setCodex] = useState<CampaignCodex | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      loadCodex();
    }
  }, [campaignId]);

  const loadCodex = async () => {
    if (!campaignId) return;
    setLoading(true);
    const data = await db.codex.get(campaignId);
    if (data) {
      setCodex(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!codex) return;
    setSaving(true);
    setSaved(false);
    await db.codex.update(codex);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
      <div className="text-center text-zinc-500 py-12">
        Failed to load codex data.
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
