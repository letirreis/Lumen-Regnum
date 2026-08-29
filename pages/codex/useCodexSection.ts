import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../services/store';
import { CampaignCodex } from '../../types';
import { useToast } from '../../components/Toast';

// Shared load/create/save logic for every Codex section page (MainArc, WorldLore, etc).
// Centralizing this also fixes a class of bugs where db.codex.update()'s error was
// ignored and the UI showed "Saved" even when the write failed.
export function useCodexSection() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [codex, setCodex] = useState<CampaignCodex | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCodex = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    const data = await db.codex.get(campaignId);
    setCodex(data);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      loadCodex();
    }
  }, [campaignId, loadCodex]);

  const handleCreateCodex = useCallback(async () => {
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
  }, [campaignId]);

  const handleSave = useCallback(async () => {
    if (!codex) return;
    setSaving(true);
    setSaved(false);
    const { error: saveError } = await db.codex.update(codex);
    setSaving(false);
    if (saveError) {
      showToast(`Failed to save: ${saveError.message}`, 'error');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [codex, showToast]);

  // Persists a fully-updated codex immediately, for flows (add/edit/delete a list
  // item) that must not rely on the user remembering to click the page's Save button.
  const persist = useCallback(async (updated: CampaignCodex): Promise<boolean> => {
    setCodex(updated);
    const { error: saveError } = await db.codex.update(updated);
    if (saveError) {
      showToast(`Failed to save: ${saveError.message}`, 'error');
      return false;
    }
    return true;
  }, [showToast]);

  return { campaignId, codex, setCodex, saving, saved, loading, error, handleSave, handleCreateCodex, persist };
}
