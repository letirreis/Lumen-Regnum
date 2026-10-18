// POST /api/stripe-webhook  (chamado só pelo Stripe; autenticado pela assinatura)
// Único lugar que concede/remove plano pago. Escreve em dmos_subscriptions com a service_role.
import { env, json, sb, stripe, verifyStripeSignature } from './_lib/stripe.js';

const GRACE_MS = 3 * 24 * 3600 * 1000; // folga após o fim do período, caso um aviso do Stripe atrase
const ACTIVE = new Set(['active', 'trialing', 'past_due']);

async function syncSubscription(sub: any): Promise<void> {
  const userId: string | undefined = sub?.metadata?.user_id;
  if (!userId) { console.warn('subscription without user_id metadata', sub?.id); return; }

  const item = sub.items?.data?.[0];
  const tier: string | undefined = item?.price?.metadata?.tier || sub.metadata?.tier;
  const periodEnd: number | undefined = item?.current_period_end ?? sub.current_period_end;
  const customer: string = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

  if (ACTIVE.has(sub.status) && (tier === 'starter' || tier === 'full') && periodEnd) {
    await sb('POST', '/dmos_subscriptions?on_conflict=user_id', {
      user_id: userId,
      tier,
      tier_expires_at: new Date(periodEnd * 1000 + GRACE_MS).toISOString(),
      source: 'stripe',
      stripe_customer_id: customer,
      stripe_subscription_id: sub.id,
      updated_at: new Date().toISOString(),
    }, { Prefer: 'resolution=merge-duplicates,return=minimal' });
  } else {
    // cancelada / não paga: volta ao grátis, mas só se o plano atual veio deste mesmo Stripe
    await sb('PATCH', `/dmos_subscriptions?user_id=eq.${userId}&source=eq.stripe&stripe_subscription_id=eq.${sub.id}`, {
      tier: 'free', tier_expires_at: null, updated_at: new Date().toISOString(),
    }, { Prefer: 'return=minimal' });
  }
}

export async function POST(request: Request): Promise<Response> {
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), env('STRIPE_WEBHOOK_SECRET'))) {
    return json({ error: 'bad_signature' }, 400);
  }
  const event = JSON.parse(payload);
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        if (s.mode === 'subscription' && s.subscription) {
          const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
          await syncSubscription(await stripe('GET', `/subscriptions/${subId}`));
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object);
        break;
      case 'invoice.paid': {
        const subId = event.data.object.subscription || event.data.object.parent?.subscription_details?.subscription;
        if (subId) await syncSubscription(await stripe('GET', `/subscriptions/${subId}`));
        break;
      }
      default:
        break;
    }
    return json({ received: true });
  } catch (e) {
    console.error('webhook handling failed', event?.type, e);
    return json({ error: 'handler_failed' }, 500); // o Stripe tenta de novo
  }
}
