import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/store';
import { CampaignCodex } from '../../types';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle } from 'lucide-react';

export const ToneAesthetic: React.FC = () => {
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

  const updateToneAesthetic = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      tone_and_aesthetic: {
        ...codex.tone_and_aesthetic,
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
      <div className="text-center text-zinc-500 py-12">
        Failed to load codex data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">Tone & Aesthetic</h1>
          <p className="text-zinc-400 text-sm">Define the mood, feel, and boundaries of your campaign</p>
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
          label="Emotional Palette"
          placeholder="What emotions do you want to evoke? Dark, hopeful, gritty, whimsical?"
          value={codex.tone_and_aesthetic.emotional_palette || ''}
          onChange={(e) => updateToneAesthetic('emotional_palette', e.target.value)}
          rows={5}
        />

        <Textarea
          label="Inspirations"
          placeholder="What media, books, movies, or games inspire this campaign?"
          value={codex.tone_and_aesthetic.inspirations || ''}
          onChange={(e) => updateToneAesthetic('inspirations', e.target.value)}
          rows={5}
        />

        <Textarea
          label="Pacing"
          placeholder="How do you want the campaign to feel? Fast-paced action, slow-burn mystery, sandbox exploration?"
          value={codex.tone_and_aesthetic.pacing || ''}
          onChange={(e) => updateToneAesthetic('pacing', e.target.value)}
          rows={5}
        />

        <Textarea
          label="Hard Limits / Do Not Include"
          placeholder="Content to avoid or boundaries for the table (e.g., no graphic violence, no romance, etc.)"
          value={codex.tone_and_aesthetic.hard_limits || ''}
          onChange={(e) => updateToneAesthetic('hard_limits', e.target.value)}
          rows={5}
        />
      </Card>
    </div>
  );
};
