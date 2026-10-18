import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signIn, signUp, resetPassword } from '../services/supabase';
import { savePlanIntent, type PaidTier } from '../services/billing';
import type { TKey } from '../i18n';
import { Button, Input, Card } from '../components/ui';
import { Shield, Scroll, Crown, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useI18n } from '../i18n';
import { authErrorKey } from '../i18n/authErrors';

interface AuthProps {
    onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const { t, setLocale } = useI18n();
    // Links das páginas de venda: /#/?mode=signup&plan=starter&lang=en  (ou &invite=CODIGO)
    const [params] = useSearchParams();
    const planParam = params.get('plan');
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(params.get('mode') === 'signup' ? 'signup' : 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState(() => (params.get('invite') || '').toUpperCase().slice(0, 40));
    // Cadastro: ou código de convite, ou escolha de plano (o convite define o plano sozinho)
    const [hasInvite, setHasInvite] = useState(() => !!params.get('invite'));
    const [chosenTier, setChosenTier] = useState<'free' | PaidTier>(planParam === 'starter' || planParam === 'full' ? planParam : 'free');

    useEffect(() => {
        const lang = params.get('lang');
        if (lang === 'en' || lang === 'pt-BR') setLocale(lang, { remote: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const cleanEmail = email.trim();

            if (mode === 'login') {
                await signIn(cleanEmail, password);
                onLoginSuccess();
            } else if (mode === 'signup') {
                // With the invite option on, the code is required (the server validates it again)
                if (hasInvite && !inviteCode.trim()) {
                    setError(t('auth.inviteRequired'));
                    setLoading(false);
                    return;
                }

                // Validate password length
                if (password.length < 8) {
                    setError(t('auth.passwordTooShort'));
                    setLoading(false);
                    return;
                }

                // Validate password confirmation
                if (password !== confirmPassword) {
                    setError(t('auth.passwordMismatch'));
                    setLoading(false);
                    return;
                }
                
                await signUp(cleanEmail, password, hasInvite ? inviteCode.trim() : '');
                // Só uma intenção: depois do login a pessoa é levada ao pagamento. O plano só vale quando o Stripe confirmar.
                savePlanIntent(!hasInvite && chosenTier !== 'free' ? chosenTier : null);
                setMessage(!hasInvite && chosenTier !== 'free'
                    ? `${t('auth.signupSuccess')} ${t('auth.plan.paidNext', { tier: t(`plan.tier.${chosenTier}` as TKey) })}`
                    : t('auth.signupSuccess'));
                setMode('login'); // Switch to login view
                setPassword('');
                setConfirmPassword('');
                setInviteCode('');
                setHasInvite(false);
                setChosenTier('free');
            } else if (mode === 'forgot') {
                await resetPassword(cleanEmail);
                setMessage(t('auth.resetSent'));
                setMode('login');
            }
        } catch (err: any) {
            const raw: string = err?.message || '';
            // The invite trigger rejects the insert; Supabase Auth reports that as a generic database error.
            if (mode === 'signup' && hasInvite && /database error saving new user/i.test(raw)) {
                setError(t('auth.inviteInvalid'));
            } else {
                const key = authErrorKey(raw);
                setError(key ? t(key) : (raw || t('common.unexpectedError')));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Círculo Arcano (Glow) Atrás do Card */}
            <div className="absolute inset-0 m-auto w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px] pointer-events-none z-0"></div>

            <div className="relative z-10 mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <Crown className="w-12 h-12 text-gold mx-auto mb-4 drop-shadow-lg" />
                <h1 className="text-4xl font-cinzel font-bold text-gold tracking-[0.25em] drop-shadow-md">
                    {t('app.name').toUpperCase()}
                </h1>
                <p className="text-[#7E8299] text-xs uppercase tracking-[0.3em] mt-3 font-bold">
                    {t('app.tagline')}
                </p>
            </div>

            <Card className="relative z-10 w-full max-w-md border-gold/30 bg-shadow/95 shadow-2xl backdrop-blur-md p-8 animate-in zoom-in-95 duration-500">
                {mode !== 'forgot' && (
                    <div className="flex border-b border-gold/10 mb-6">
                        <button 
                            className={`flex-1 pb-2 text-sm font-cinzel font-bold tracking-wide transition-colors ${mode === 'login' ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                            onClick={() => { setMode('login'); setError(null); setMessage(null); setPassword(''); setConfirmPassword(''); setInviteCode(''); setHasInvite(false); setChosenTier('free'); }}
                        >
                            {t('auth.tabLogin')}
                        </button>
                        <button 
                            className={`flex-1 pb-2 text-sm font-cinzel font-bold tracking-wide transition-colors ${mode === 'signup' ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                            onClick={() => { setMode('signup'); setError(null); setMessage(null); setPassword(''); setConfirmPassword(''); setInviteCode(''); setHasInvite(false); setChosenTier('free'); }}
                        >
                            {t('auth.tabSignup')}
                        </button>
                    </div>
                )}
                
                {mode === 'forgot' && (
                    <div className="mb-6 pb-4 border-b border-gold/10">
                        <h2 className="text-xl font-cinzel font-bold text-gold text-center tracking-wide">{t('auth.recoverTitle')}</h2>
                        <p className="text-xs text-zinc-400 text-center mt-2">{t('auth.recoverSubtitle')}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-300">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 bg-green-900/20 border border-green-900/50 rounded flex items-start gap-2">
                        <Scroll className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-300">{message}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        label={t('auth.email')} 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        placeholder="master@lumen.regnum"
                        className="bg-obsidian border-zinc-800 focus:border-violet"
                    />
                    
                    {mode !== 'forgot' && (
                        <Input 
                            label={t('auth.password')} 
                            type="password" 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-obsidian border-zinc-800 focus:border-violet"
                        />
                    )}
                    
                    {mode === 'signup' && (
                        <Input
                            label={t('auth.confirmPassword')}
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-obsidian border-zinc-800 focus:border-violet"
                        />
                    )}

                    {mode === 'signup' && !hasInvite && (
                        <fieldset className="space-y-2">
                            <legend className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">{t('auth.choosePlan')}</legend>
                            {(['free', 'starter', 'full'] as const).map((tier) => (
                                <label
                                    key={tier}
                                    className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${chosenTier === tier ? 'border-gold bg-gold/5' : 'border-zinc-800 hover:border-zinc-600'}`}
                                >
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={tier}
                                        checked={chosenTier === tier}
                                        onChange={() => setChosenTier(tier)}
                                        className="mt-1 accent-[#d4af37]"
                                    />
                                    <span className="flex-1 min-w-0">
                                        <span className="flex justify-between gap-2 font-cinzel text-sm text-gold">
                                            <span>{t(`plan.tier.${tier}` as TKey)}</span>
                                            <span className="text-silver/80 font-sans text-xs">{t(`auth.plan.price.${tier}` as TKey)}</span>
                                        </span>
                                        <span className="block text-xs text-zinc-400 mt-0.5">{t(`plan.tierHint.${tier}` as TKey)}</span>
                                    </span>
                                </label>
                            ))}
                            {chosenTier !== 'free' && <p className="text-[11px] text-zinc-500">{t('auth.plan.priceNote')}</p>}
                        </fieldset>
                    )}

                    {mode === 'signup' && hasInvite && (
                        <div className="space-y-2">
                            <Input
                                label={t('auth.inviteCode')}
                                type="text"
                                required
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                placeholder="LUMEN-XXXX-XXXX-XXXX"
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                className="bg-obsidian border-zinc-800 focus:border-violet font-mono tracking-wider"
                            />
                            <p className="text-[11px] text-zinc-500">{t('auth.inviteGivesPlan')}</p>
                        </div>
                    )}

                    {mode === 'signup' && (
                        <button
                            type="button"
                            onClick={() => { setHasInvite(v => !v); setError(null); }}
                            className="text-xs text-zinc-400 hover:text-gold transition-colors font-cinzel underline underline-offset-4"
                        >
                            {hasInvite ? t('auth.noInvite') : t('auth.hasInvite')}
                        </button>
                    )}

                    <Button 
                        type="submit" 
                        className="w-full mt-2" 
                        disabled={loading}
                    >
                        {loading ? t('auth.processing') : (
                            mode === 'login' ? t('auth.submitLogin') : 
                            mode === 'signup' ? t('auth.submitSignup') : 
                            t('auth.submitReset')
                        )}
                    </Button>
                </form>
                
                {mode === 'login' && (
                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
                            className="text-xs text-zinc-400 hover:text-gold transition-colors font-cinzel"
                        >
                            {t('auth.forgot')}
                        </button>
                    </div>
                )}
                
                {mode === 'forgot' && (
                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                            className="text-xs text-zinc-400 hover:text-gold transition-colors font-cinzel"
                        >
                            {t('auth.backToLogin')}
                        </button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-zinc-500 font-serif italic opacity-70">
                        "{t('auth.quote')}"
                    </p>
                </div>
            </Card>

            <div className="relative z-10 mt-8 text-center text-zinc-700 text-xs">
                 <LanguageSwitcher className="mb-3" />
                 <p>{t('auth.footer')}</p>
            </div>
        </div>
    );
};