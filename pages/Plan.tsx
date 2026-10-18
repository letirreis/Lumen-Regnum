import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Check, Crown } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n';
import { fetchMyPlan, MyPlan, PLAN_RESOURCES, UNLIMITED_FROM } from '../services/plan';

const FEATURES = ['export', 'images', 'share_link', 'co_gm', 'ai'] as const;
const NOT_BUILT_YET = new Set<string>(['images', 'share_link', 'co_gm', 'ai']);

export const PlanPage: React.FC = () => {
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<MyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyPlan().then(setPlan).catch((e) => setError(e?.message || t('common.unknownError')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expired = plan && plan.stored_tier !== 'free' && plan.tier === 'free';

  return (
    <div className="max-w-3xl mx-auto pt-12 space-y-6">
      <button onClick={() => navigate('/')} className="text-xs text-silver/60 hover:text-white">{t('plan.back')}</button>
      <h1 className="font-cinzel text-2xl text-gold tracking-wider">{t('plan.title')}</h1>

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
              {plan.tier !== 'full' && (
                <Button variant="secondary" disabled title={t('plan.upgradeSoon')}>
                  {t('plan.upgrade')} ({t('plan.upgradeSoon')})
                </Button>
              )}
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
            </ul>
          </Card>

          <Card title={t('plan.features')}>
            <ul className="space-y-2">
              {FEATURES.map((f) => {
                const on = !!plan.features[f];
                return (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    {on ? <Check className="w-4 h-4 text-emerald-400" aria-label={t('plan.feature.on')} />
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
