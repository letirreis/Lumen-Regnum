import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Check, Crown, Clock } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n';
import { fetchMyPlan, MyPlan, PLAN_RESOURCES, UNLIMITED_FROM } from '../services/plan';
import { startCheckout, openBillingPortal, BillingError, type PaidTier } from '../services/billing';

const FEATURES = ['export', 'images', 'share_link', 'co_gm', 'ai'] as const;
const NOT_BUILT_YET = new Set<string>(['share_link', 'co_gm', 'ai']);

export const PlanPage: React.FC = () => {
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<MyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params] = useSearchParams();
  const checkout = params.get('checkout'); // 'success' | 'cancel' depois de voltar do Stripe
  const [busy, setBusy] = useState(false);
  const [billingMsg, setBillingMsg] = useState<string | null>(null);
  const [checkoutNote, setCheckoutNote] = useState<string | null>(
    checkout === 'success' ? t('plan.checkout.success') : checkout === 'cancel' ? t('plan.checkout.cancel') : null,
  );

  useEffect(() => {
    fetchMyPlan().then(setPlan).catch((e) => setError(e?.message || t('common.unknownError')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Depois do pagamento, o Stripe avisa o servidor por webhook (alguns segundos): consulta até o plano mudar.
  useEffect(() => {
    if (checkout !== 'success') return;
    let tries = 0;
    const timer = window.setInterval(async () => {
      tries += 1;
      try {
        const p = await fetchMyPlan();
        if (p.tier !== 'free') {
          setPlan(p);
          setCheckoutNote(t('plan.checkout.updated'));
          window.clearInterval(timer);
          return;
        }
      } catch { /* tenta de novo */ }
      if (tries >= 10) { setCheckoutNote(t('plan.checkout.slow')); window.clearInterval(timer); }
    }, 2000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout]);

  const billing = async (action: () => Promise<void>) => {
    setBusy(true);
    setBillingMsg(null);
    try {
      await action();
    } catch (e) {
      setBillingMsg(e instanceof BillingError && e.code === 'already_subscribed' ? t('plan.billing.already') : t('plan.billing.error'));
      setBusy(false);
    }
  };
  const subscribe = (tier: PaidTier) => billing(() => startCheckout(tier));
  const hasStripeSub = !!plan && plan.source === 'stripe' && plan.tier !== 'free';

  const expired = plan && plan.stored_tier !== 'free' && plan.tier === 'free';

  return (
    <div className="max-w-3xl mx-auto pt-12 space-y-6">
      <button onClick={() => navigate('/')} className="text-xs text-silver/60 hover:text-white">{t('plan.back')}</button>
      <h1 className="font-cinzel text-2xl text-gold tracking-wider">{t('plan.title')}</h1>

      {checkoutNote && <p role="status" className="text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-900/50 rounded p-3">{checkoutNote}</p>}
      {billingMsg && <p role="alert" className="text-sm text-red-300 bg-red-950/30 border border-red-900/50 rounded p-3">{billingMsg}</p>}
      {error && <p className="text-red-400 text-sm">{t('plan.loadError', { detail: error })}</p>}
      {!plan && !error && <p className="text-silver/60 text-sm">{t('plan.loading')}</p>}

      {plan && (
        <>
          <Card title={t('plan.current')}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-xl font-cinzel text-gold">
                  <Crown className="w-5 h-5" aria-hidden="true" />
                  {t(`plan.tier.${plan.tier}` as TKey)}
                </div>
                <p className="text-sm text-silver/70 mt-1">{t(`plan.tierHint.${plan.tier}` as TKey)}</p>
                {plan.tier !== 'free' && (
                  <p className="text-xs text-silver/50 mt-1">
                    {plan.expires_at ? t('plan.expiresOn', { date: formatDate(plan.expires_at) }) : t('plan.noExpiry')}
                  </p>
                )}
                {expired && <p className="text-xs text-amber-400 mt-2">{t('plan.expiredNote')}</p>}
              </div>
              <div className="flex flex-col gap-2 items-stretch">
                {hasStripeSub ? (
                  <Button variant="secondary" disabled={busy} onClick={() => billing(openBillingPortal)}>{t('plan.manage')}</Button>
                ) : (
                  (['starter', 'full'] as const)
                    .filter((tier) => tier !== plan.tier && !(tier === 'starter' && plan.tier === 'full'))
                    .map((tier) => (
                      <Button key={tier} variant="secondary" disabled={busy} onClick={() => subscribe(tier)}>
                        {t('plan.subscribe', { tier: t(`plan.tier.${tier}` as TKey) })} · {t(`auth.plan.price.${tier}` as TKey)}
                      </Button>
                    ))
                )}
              </div>
            </div>
          </Card>

          <Card title={t('plan.usage')}>
            <ul className="space-y-3">
              {PLAN_RESOURCES.map((r) => {
                const used = plan.usage[r] ?? 0;
                const limit = plan.limits[r] ?? 0;
                const unlimited = limit >= UNLIMITED_FROM;
                const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
                return (
                  <li key={r}>
                    <div className="flex justify-between text-sm">
                      <span>{t(`plan.res.${r}` as TKey)}</span>
                      <span className={!unlimited && used >= limit ? 'text-amber-400' : 'text-silver/70'}>
                        {used} / {unlimited ? t('plan.unlimited') : limit}
                      </span>
                    </div>
                    {!unlimited && (
                      <div className="h-1.5 bg-white/5 rounded mt-1" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
                        <div className={`h-full rounded ${pct >= 100 ? 'bg-amber-500' : 'bg-gold/70'}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </li>
                );
              })}
              {plan.media && (
                <li>
                  <div className="flex justify-between text-sm">
                    <span>{t('plan.mediaUsage')}</span>
                    <span className="text-silver/70">
                      {plan.media.bytes_limit === 0
                        ? t('plan.mediaNone')
                        : `${(plan.media.bytes_used / 1048576).toFixed(1)} MB / ${Math.round(plan.media.bytes_limit / 1048576)} MB · ${t('plan.mediaFiles', { count: plan.media.files_used })}`}
                    </span>
                  </div>
                  {plan.media.bytes_limit > 0 && (
                    <div className="h-1.5 bg-white/5 rounded mt-1" role="progressbar" aria-valuenow={plan.media.bytes_used} aria-valuemin={0} aria-valuemax={plan.media.bytes_limit}>
                      <div
                        className={`h-full rounded ${plan.media.bytes_used >= plan.media.bytes_limit ? 'bg-amber-500' : 'bg-gold/70'}`}
                        style={{ width: `${Math.min(100, Math.round((plan.media.bytes_used / plan.media.bytes_limit) * 100))}%` }}
                      />
                    </div>
                  )}
                </li>
              )}
            </ul>
          </Card>

          <Card title={t('plan.features')}>
            <ul className="space-y-2">
              {FEATURES.map((f) => {
                const on = !!plan.features[f];
                return (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    {NOT_BUILT_YET.has(f) ? <Clock className="w-4 h-4 text-silver/40" aria-label={t('plan.feature.soon')} />
                        : on ? <Check className="w-4 h-4 text-emerald-400" aria-label={t('plan.feature.on')} />
                        : <Lock className="w-4 h-4 text-silver/40" aria-label={t('plan.feature.off')} />}
                    <span className={on ? '' : 'text-silver/50'}>{t(`plan.feat.${f}` as TKey)}</span>
                    {NOT_BUILT_YET.has(f) && <span className="text-[10px] uppercase text-silver/40">({t('plan.feature.soon')})</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
};
