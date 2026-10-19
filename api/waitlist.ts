// POST /api/waitlist  { email, lang, source, utm, website }
// Guarda o e-mail na lista de espera. Responde sempre {ok:true} para e-mails válidos (inclusive repetidos),
// para a rota não revelar quem já está na lista. O campo "website" é uma armadilha para robôs.
import { json, sb } from './_lib/stripe.js';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const hits = new Map<string, number[]>(); // limite por IP (melhor esforço: cada instância tem a sua memória)

function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (tooMany(ip)) return json({ error: 'rate_limited' }, 429);

    const body = (await request.json().catch(() => ({}))) as { email?: unknown; lang?: unknown; source?: unknown; utm?: unknown; website?: unknown };
    if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true }); // robô: finge que deu certo

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) return json({ error: 'invalid_email' }, 400);
    const lang = body.lang === 'en' ? 'en' : 'pt-BR';
    const source = typeof body.source === 'string' ? body.source.slice(0, 60) : null;

    // UTM: só as 5 chaves padrão, texto curto. Qualquer outra coisa é descartada.
    const utm: Record<string, string> = {};
    if (body.utm && typeof body.utm === 'object') {
      for (const k of UTM_KEYS) {
        const v = (body.utm as Record<string, unknown>)[k];
        if (typeof v === 'string' && v.trim()) utm[k] = v.trim().slice(0, 100);
      }
    }

    const prefer = { Prefer: 'resolution=ignore-duplicates,return=minimal' };
    try {
      await sb('POST', '/dmos_waitlist?on_conflict=email', { email, lang, source, ...(Object.keys(utm).length ? { utm } : {}) }, prefer);
    } catch (e) {
      // Migração 024 ainda não aplicada (coluna utm não existe): não perde o cadastro, só a atribuição.
      if (Object.keys(utm).length === 0) throw e;
      console.warn('waitlist: gravando sem utm', e);
      await sb('POST', '/dmos_waitlist?on_conflict=email', { email, lang, source }, prefer);
    }
    return json({ ok: true });
  } catch (e) {
    console.error('waitlist failed', e);
    return json({ error: 'failed' }, 500);
  }
}
