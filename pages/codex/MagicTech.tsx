import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/store';
import { CampaignCodex } from '../../types';
import { Card, Button, Textarea } from '../../components/ui';
import { Save, CheckCircle } from 'lucide-react';

export const MagicTech: React.FC = () => {
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

  const updateMagicTech = (field: string, value: string) => {
    if (!codex) return;
    setCodex({
      ...codex,
      magic_and_technology: {
        ...codex.magic_and_technology,
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
          <h1 className="text-3xl font-cinzel font-bold text-gold mb-2 tracking-wide">Magic & Technology</h1>
          <p className="text-zinc-400 text-sm">Define how magic and technology work in your world</p>
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
          label="Magic Nature"
          placeholder="What is magic? Where does it come from? How does it manifest?"
          value={codex.magic_and_technology.magic_nature || ''}
          onChange={(e) => updateMagicTech('magic_nature', e.target.value)}
          rows={6}
        />

        <Textarea
          label="How Common is Magic"
          placeholder="Is magic rare, common, or somewhere in between? Who can use it?"
          value={codex.magic_and_technology.magic_commonality || ''}
          onChange={(e) => updateMagicTech('magic_commonality', e.target.value)}
          rows={4}
        />

        <Textarea
          label="Costs & Risks"
          placeholder="What are the consequences of using magic? Corruption, exhaustion, or other costs?"
          value={codex.magic_and_technology.costs_risks || ''}
          onChange={(e) => updateMagicTech('costs_risks', e.target.value)}
          rows={4}
        />

        <Textarea
          label="Technology Level"
          placeholder="What is the technology level? Medieval, Renaissance, Industrial, or a mix?"
          value={codex.magic_and_technology.technology_level || ''}
          onChange={(e) => updateMagicTech('technology_level', e.target.value)}
          rows={4}
        />
      </Card>
    </div>
  );
};
