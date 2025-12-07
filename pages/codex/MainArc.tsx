import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/store';
import { CampaignCodex } from '../../types';
import { Card, Button, Input, Textarea } from '../../components/ui';
import { Save, CheckCircle } from 'lucide-react';

export const MainArc: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const [codex, setCodex] = useState<CampaignCodex | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadCodex();
    }
  }, [campaignId]);

  const loadCodex = async () => {
    if (!campaignId) return;
    setLoading(true);
    const data = await db.codex.get(campaignId);
    setCodex(data);
    setLoading(false);
  };

  const handleCreateCodex = async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    const data = await db.codex.create(campaignId);
    if (data) {
      setCodex(data);
    } else {
      setError('Failed to create codex. Please check the console for details or contact support.');
      console.error('Codex creation failed for campaign:', campaignId);
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

  const updateMainArc = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      main_arc: {
        ...codex.main_arc,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">Main Arc</h1>
          <p className="text-zinc-400 text-sm">Define the core narrative of your campaign</p>
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
          label="Premise"
          placeholder="The core premise of your campaign in 1–3 paragraphs..."
          value={codex.main_arc.premise || ''}
          onChange={(e) => updateMainArc('premise', e.target.value)}
          rows={6}
        />

        <Textarea
          label="Core Conflict"
          placeholder="What is the central conflict driving the story?"
          value={codex.main_arc.core_conflict || ''}
          onChange={(e) => updateMainArc('core_conflict', e.target.value)}
          rows={4}
        />

        <Textarea
          label="Primary Antagonist(s)"
          placeholder="Who opposes the heroes? What are their goals?"
          value={codex.main_arc.primary_antagonist || ''}
          onChange={(e) => updateMainArc('primary_antagonist', e.target.value)}
          rows={4}
        />

        <Input
          label="Themes"
          placeholder="e.g., tragedy, politics, corruption, redemption"
          value={codex.main_arc.themes || ''}
          onChange={(e) => updateMainArc('themes', e.target.value)}
        />

        <div className="mb-4">
          <label className="block text-[10px] font-cinzel text-gold mb-2 tracking-[0.25em] uppercase font-bold">
            Arc Status
          </label>
          <select
            value={codex.main_arc.arc_status || 'Beginning'}
            onChange={(e) => updateMainArc('arc_status', e.target.value)}
            className="flex h-10 w-full rounded-sm border border-twilight/50 bg-[#09090B] px-3 py-1 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
          >
            <option value="Beginning">Beginning</option>
            <option value="Rising Conflict">Rising Conflict</option>
            <option value="Climax">Climax</option>
            <option value="Resolution">Resolution</option>
          </select>
        </div>

        <Textarea
          label="Final Goal"
          placeholder="What is the ultimate objective? How does the arc conclude?"
          value={codex.main_arc.final_goal || ''}
          onChange={(e) => updateMainArc('final_goal', e.target.value)}
          rows={4}
        />
      </Card>
    </div>
  );
};
