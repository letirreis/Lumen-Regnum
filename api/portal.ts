// POST /api/portal  (Authorization: Bearer <token do Supabase>)
// Abre o portal do Stripe para o usuário gerenciar/cancelar a própria assinatura. Devolve { url }.
import { authUser, env, json, sb, stripe } from './_lib/stripe';

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await authUser(request);
    if (!user) return json({ error: 'unauthorized' }, 401);
    const rows = await sb('GET', `/dmos_subscriptions?user_id=eq.${user.id}&select=stripe_customer_id`);
    const customer = rows?.[0]?.stripe_customer_id;
    if (!customer) return json({ error: 'no_customer' }, 404);
    const session = await stripe('POST', '/billing_portal/sessions', {
      customer,
      return_url: `${env('SITE_URL').replace(/\/$/, '')}/#/plan`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('portal failed', e);
    return json({ error: 'portal_failed' }, 500);
  }
}
