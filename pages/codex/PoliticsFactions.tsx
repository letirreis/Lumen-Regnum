import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/store';
import { CampaignCodex } from '../../types';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle } from 'lucide-react';

export const PoliticsFactions: React.FC = () => {
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
    setCodex(data);
    setLoading(false);
  };

  const handleCreateCodex = async () => {
    if (!campaignId) return;
    setLoading(true);
    const data = await db.codex.create(campaignId);
    setCodex(data);
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

  const updatePoliticsFactions = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      politics_and_factions: {
        ...codex.politics_and_factions,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">Politics & Factions</h1>
          <p className="text-zinc-400 text-sm">Map the political landscape and power dynamics</p>
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
          label="Political Landscape"
          placeholder="Describe the political structure of your world. Kingdoms, republics, empires?"
          value={codex.politics_and_factions.political_landscape || ''}
          onChange={(e) => updatePoliticsFactions('political_landscape', e.target.value)}
          rows={6}
        />

        <Textarea
          label="Major Powers"
          placeholder="Who are the major powers? Rulers, organizations, and influential figures..."
          value={codex.politics_and_factions.major_powers || ''}
          onChange={(e) => updatePoliticsFactions('major_powers', e.target.value)}
          rows={6}
        />

        <Textarea
          label="Current Tensions & Conflicts"
          placeholder="What conflicts exist between factions? Wars, rivalries, or political intrigue..."
          value={codex.politics_and_factions.tensions_conflicts || ''}
          onChange={(e) => updatePoliticsFactions('tensions_conflicts', e.target.value)}
          rows={6}
        />
      </Card>
    </div>
  );
};
