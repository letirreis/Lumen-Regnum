import { supabase } from './supabase';

export type Tier = 'free' | 'starter' | 'full';

export interface MyPlan {
  tier: Tier;
  stored_tier: Tier;
  expires_at: string | null;
  source: string;
  usage: Record<string, number>;
  limits: Record<string, number>;
  features: Record<string, boolean>;
  media?: { bytes_used: number; bytes_limit: number; files_used: number; files_limit: number };
}

/** Ordem de exibição dos recursos medidos (nomes = tabelas; ver migração 020). */
export const PLAN_RESOURCES = [
  'dmos_campaigns', 'dmos_npcs', 'dmos_locations', 'dmos_factions', 'dmos_items', 'dmos_monsters',
  'dmos_characters', 'dmos_sessions', 'dmos_session_scenes', 'dmos_encounters', 'dmos_notes', 'dmos_tags',
] as const;

/** Acima disso o limite é só um teto anti-abuso e a tela mostra "Ilimitado". */
export const UNLIMITED_FROM = 1000;

/**
 * O plano vem SEMPRE do servidor (RPC my_plan). O app só exibe: quem decide e bloqueia é o banco
 * (triggers de cota), então alterar algo no navegador não libera nada.
 */
export async function fetchMyPlan(): Promise<MyPlan> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.rpc('my_plan');
  if (error) throw error;
  return data as MyPlan;
}

/** Backup JSON da campanha. Recurso Starter/Full, validado no servidor. */
export async function exportCampaign(campaignId: string): Promise<unknown> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.rpc('export_campaign', { p_campaign_id: campaignId });
  if (error) throw error;
  return data;
}
