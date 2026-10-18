import { supabase } from './supabase';
import { getLocale } from '../i18n';

export type PaidTier = 'starter' | 'full';

export class BillingError extends Error {
  constructor(public code: string) { super(code); }
}

async function post(path: string, body?: unknown): Promise<string> {
  if (!supabase) throw new BillingError('unavailable');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new BillingError('unauthorized');
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new BillingError(data?.error || 'failed');
  return data.url as string;
}

/** Vai para o pagamento do Stripe. O preço é decidido no servidor; aqui só vai o nome do plano. */
export async function startCheckout(tier: PaidTier): Promise<void> {
  window.location.assign(await post('/api/checkout', { tier, locale: getLocale() }));
}

/** Abre o portal do Stripe (trocar de plano, atualizar cartão, cancelar). */
export async function openBillingPortal(): Promise<void> {
  window.location.assign(await post('/api/portal'));
}

const INTENT_KEY = 'lr_plan_intent';

/** Plano escolhido no cadastro: só uma intenção (dica de tela). Quem concede plano é o servidor. */
export function savePlanIntent(tier: PaidTier | null) {
  try { if (tier) localStorage.setItem(INTENT_KEY, tier); else localStorage.removeItem(INTENT_KEY); } catch { /* ignora */ }
}
export function takePlanIntent(): PaidTier | null {
  try {
    const v = localStorage.getItem(INTENT_KEY);
    localStorage.removeItem(INTENT_KEY);
    return v === 'starter' || v === 'full' ? v : null;
  } catch { return null; }
}
