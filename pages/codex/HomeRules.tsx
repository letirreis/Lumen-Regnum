import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/store';
import { CampaignCodex } from '../../types';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle, BookOpen } from 'lucide-react';

export const HomeRules: React.FC = () => {
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

  const updateHomeRules = (value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      home_rules: value,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">Home Rules</h1>
          <p className="text-zinc-400 text-sm">Document your custom rules and system modifications</p>
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
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-violet/20">
          <BookOpen className="w-5 h-5 text-violet-light" />
          <span className="text-sm text-violet-light font-cinzel font-semibold">
            Custom Rules & Modifications
          </span>
        </div>
        
        <Textarea
          label="House Rules"
          placeholder="List your custom rules, modifications to the system, or clarifications...

Examples:
• Critical hits deal maximum damage + roll
• Flanking grants advantage
• Resurrection requires a ritual and rare components
• Inspiration can be used after rolling
• Modified resting rules: Short rest = 1 hour, Long rest = 8 hours in safe location"
          value={codex.home_rules || ''}
          onChange={(e) => updateHomeRules(e.target.value)}
          rows={20}
        />
      </Card>
    </div>
  );
};
