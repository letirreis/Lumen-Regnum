// Pequenos auxiliares para as funções de servidor (Vercel). Sem SDK: só fetch + crypto.
// Segredos vêm de variáveis de ambiente da Vercel e NUNCA chegam ao navegador:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, SITE_URL
import { createHmac, timingSafeEqual } from 'node:crypto';

export const env = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
};

export const supabaseUrl = (): string =>
  (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Chama a API do Stripe (form-encoded, com chaves aninhadas no formato a[b][c]=v). */
export async function stripe(method: 'GET' | 'POST', path: string, params?: Record<string, unknown>): Promise<any> {
  const body = params ? new URLSearchParams(flatten(params)).toString() : undefined;
  const res = await fetch(`https://api.stripe.com/v1${path}${method === 'GET' && body ? `?${body}` : ''}`, {
    method,
    headers: {
      Authorization: `Bearer ${env('STRIPE_SECRET_KEY')}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method === 'POST' ? body : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error ${res.status}`);
  return data;
}

function flatten(obj: Record<string, unknown>, prefix = ''): [string, string][] {
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((item, i) => {
      if (item && typeof item === 'object') out.push(...flatten(item as Record<string, unknown>, `${key}[${i}]`));
      else out.push([`${key}[${i}]`, String(item)]);
    });
    else if (typeof v === 'object') out.push(...flatten(v as Record<string, unknown>, key));
    else out.push([key, String(v)]);
  }
  return out;
}

/** Descobre quem está chamando a partir do token do Supabase (nunca confia em user_id vindo do corpo). */
export async function authUser(request: Request): Promise<{ id: string; email: string } | null> {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const res = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: process.env.VITE_SUPABASE_ANON_KEY || env('SUPABASE_SERVICE_ROLE_KEY') },
  });
  if (!res.ok) return null;
  const u = await res.json();
  return u?.id ? { id: u.id, email: u.email } : null;
}

/** REST do Supabase com a service_role (só no servidor). */
export async function sb(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<any> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${supabaseUrl()}/rest/v1${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

/** Confere a assinatura do webhook do Stripe (HMAC-SHA256, com tolerância de 5 minutos). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = parts['t'];
  const sig = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || sig.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  const exp = Buffer.from(expected, 'hex');
  return sig.some((s) => {
    const got = Buffer.from(s, 'hex');
    return got.length === exp.length && timingSafeEqual(got, exp);
  });
}

export const TIER_LOOKUP: Record<string, string> = {
  starter: 'lumen_starter_monthly',
  full: 'lumen_full_monthly',
};
