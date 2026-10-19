// POST /api/checkout  { tier: 'starter' | 'full' }  (Authorization: Bearer <token do Supabase>)
// Cria uma sessão do Stripe Checkout para o usuário logado e devolve { url }.
// O preço é escolhido AQUI no servidor pelo lookup_key; o navegador nunca envia valor.
import { authUser, env, json, sb, stripe, TIER_LOOKUP } from './_lib/stripe.js';

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await authUser(request);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const { tier, locale } = (await request.json().catch(() => ({}))) as { tier?: string; locale?: string };
    const lookupKey = tier ? TIER_LOOKUP[tier] : undefined;
    if (!lookupKey) return json({ error: 'invalid_tier' }, 400);
    // O Full está fora de venda até IA e co-mestre existirem. Para reativar, defina FULL_PLAN_ENABLED=true na Vercel.
    if (tier === 'full' && process.env.FULL_PLAN_ENABLED !== 'true') return json({ error: 'tier_unavailable' }, 400);

    // Já tem assinatura ativa pelo Stripe? Então troca/cancelamento é pelo portal, não por outro checkout.
    const rows = await sb('GET', `/dmos_subscriptions?user_id=eq.${user.id}&select=tier,source,tier_expires_at,stripe_customer_id,stripe_subscription_id`);
    const sub = rows?.[0];
    const active = sub && sub.source === 'stripe' && sub.stripe_subscription_id && sub.tier !== 'free'
      && (!sub.tier_expires_at || new Date(sub.tier_expires_at) > new Date());
    if (active) return json({ error: 'already_subscribed' }, 409);

    const prices = await stripe('GET', '/prices', { lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices?.data?.[0];
    if (!price) return json({ error: 'price_not_found' }, 500);

    const site = env('SITE_URL').replace(/\/$/, '');
    const session = await stripe('POST', '/checkout/sessions', {
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: user.id,
      ...(sub?.stripe_customer_id ? { customer: sub.stripe_customer_id } : { customer_email: user.email }),
      subscription_data: { metadata: { user_id: user.id, tier } },
      metadata: { user_id: user.id, tier },
      locale: locale === 'en' ? 'en' : 'pt-BR',
      allow_promotion_codes: true,
      success_url: `${site}/#/plan?checkout=success`,
      cancel_url: `${site}/#/plan?checkout=cancel`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('checkout failed', e);
    return json({ error: 'checkout_failed' }, 500);
  }
}
