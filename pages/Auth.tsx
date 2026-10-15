import React, { useState } from 'react';
import { signIn, signUp, resetPassword } from '../services/supabase';
import { Button, Input, Card } from '../components/ui';
import { Shield, Scroll, Crown, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n';
import { authErrorKey } from '../i18n/authErrors';

interface AuthProps {
    onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const { t } = useI18n();
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
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
                // Invite-only: a code is required (the server validates it again)
                if (!inviteCode.trim()) {
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
                
                await signUp(cleanEmail, password, inviteCode.trim());
                setMessage(t('auth.signupSuccess'));
                setMode('login'); // Switch to login view
                setPassword('');
                setConfirmPassword('');
                setInviteCode('');
            } else if (mode === 'forgot') {
                await resetPassword(cleanEmail);
                setMessage(t('auth.resetSent'));
                setMode('login');
            }
        } catch (err: any) {
            const raw: string = err?.message || '';
            // The invite trigger rejects the insert; Supabase Auth reports that as a generic database error.
            if (mode === 'signup' && /database error saving new user/i.test(raw)) {
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
                            onClick={() => { setMode('login'); setError(null); setMessage(null); setPassword(''); setConfirmPassword(''); setInviteCode(''); }}
                        >
                            {t('auth.tabLogin')}
                        </button>
                        <button 
                            className={`flex-1 pb-2 text-sm font-cinzel font-bold tracking-wide transition-colors ${mode === 'signup' ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                            onClick={() => { setMode('signup'); setError(null); setMessage(null); setPassword(''); setConfirmPassword(''); setInviteCode(''); }}
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

                    {mode === 'signup' && (
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
                 <p>{t('auth.footer')}</p>
            </div>
        </div>
    );
};