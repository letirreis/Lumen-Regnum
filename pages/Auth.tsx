import React, { useState } from 'react';
import { signIn, signUp, resetPassword } from '../services/supabase';
import { Button, Input, Card } from '../components/ui';
import { Shield, Scroll, Crown, AlertCircle } from 'lucide-react';

interface AuthProps {
    onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'login') {
                await signIn(email, password);
                onLoginSuccess();
            } else if (mode === 'signup') {
                // Validate password length
                if (password.length < 6) {
                    setError("Secret Phrase must be at least 6 characters long.");
                    setLoading(false);
                    return;
                }
                
                // Validate password confirmation
                if (password !== confirmPassword) {
                    setError("Secret Phrases do not match. Please verify and try again.");
                    setLoading(false);
                    return;
                }
                
                await signUp(email, password);
                setMessage("Account created! Please check your email to confirm, or login if auto-confirmed.");
                setMode('login'); // Switch to login view
                setPassword('');
                setConfirmPassword('');
            } else if (mode === 'forgot') {
                await resetPassword(email);
                setMessage("Password reset instructions have been sent to your email. Check your inbox.");
                setMode('login');
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
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
                    LUMEN REGNUM
                </h1>
                <p className="text-[#7E8299] text-xs uppercase tracking-[0.3em] mt-3 font-bold">
                    Campaign Manager OS
                </p>
            </div>

            <Card className="relative z-10 w-full max-w-md border-gold/30 bg-shadow/95 shadow-2xl backdrop-blur-md p-8 animate-in zoom-in-95 duration-500">
                {mode !== 'forgot' && (
                    <div className="flex border-b border-gold/10 mb-6">
                        <button 
                            className={`flex-1 pb-2 text-sm font-cinzel font-bold tracking-wide transition-colors ${mode === 'login' ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                            onClick={() => { setMode('login'); setError(null); setMessage(null); setPassword(''); setConfirmPassword(''); }}
                        >
                            Access Archives
                        </button>
                        <button 
                            className={`flex-1 pb-2 text-sm font-cinzel font-bold tracking-wide transition-colors ${mode === 'signup' ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                            onClick={() => { setMode('signup'); setError(null); setMessage(null); setPassword(''); setConfirmPassword(''); }}
                        >
                            Induct New Master
                        </button>
                    </div>
                )}
                
                {mode === 'forgot' && (
                    <div className="mb-6 pb-4 border-b border-gold/10">
                        <h2 className="text-xl font-cinzel font-bold text-gold text-center tracking-wide">Recover Access</h2>
                        <p className="text-xs text-zinc-400 text-center mt-2">Enter your email to receive reset instructions</p>
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
                        label="Email Identity" 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        placeholder="master@lumen.regnum"
                        className="bg-obsidian border-zinc-800 focus:border-violet"
                    />
                    
                    {mode !== 'forgot' && (
                        <Input 
                            label="Secret Phrase" 
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
                            label="Confirm Secret Phrase" 
                            type="password" 
                            required 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-obsidian border-zinc-800 focus:border-violet"
                        />
                    )}

                    <Button 
                        type="submit" 
                        className="w-full mt-2" 
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (
                            mode === 'login' ? 'Enter the Realm' : 
                            mode === 'signup' ? 'Forge Identity' : 
                            'Send Reset Link'
                        )}
                    </Button>
                </form>
                
                {mode === 'login' && (
                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
                            className="text-xs text-zinc-400 hover:text-gold transition-colors font-cinzel"
                        >
                            Forgot your Secret Phrase?
                        </button>
                    </div>
                )}
                
                {mode === 'forgot' && (
                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                            className="text-xs text-zinc-400 hover:text-gold transition-colors font-cinzel"
                        >
                            ← Back to Login
                        </button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-zinc-500 font-serif italic opacity-70">
                        "Only those who hold the key may shape the world."
                    </p>
                </div>
            </Card>

            <div className="relative z-10 mt-8 text-center text-zinc-700 text-xs">
                 <p>Secure. Private. Offline-Capable.</p>
            </div>
        </div>
    );
};