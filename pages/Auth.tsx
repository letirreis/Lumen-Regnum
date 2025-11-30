
import React, { useState } from 'react';
import { signIn, signUp } from '../services/supabase';
import { Button, Input, Card } from '../components/ui';
import { Shield, Scroll, Crown, AlertCircle } from 'lucide-react';

interface AuthProps {
    onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                await signIn(email, password);
                onLoginSuccess();
            } else {
                await signUp(email, password);
                setMessage("Account created! Please check your email to confirm, or login if auto-confirmed.");
                setIsLogin(true); // Switch to login view
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian bg-vignette flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <Crown className="w-12 h-12 text-gold mx-auto mb-4 drop-shadow-lg" />
                <h1 className="text-4xl font-cinzel font-bold text-gold tracking-widest drop-shadow-md">
                    LUMEN REGNUM
                </h1>
                <p className="text-twilight text-xs uppercase tracking-[0.3em] mt-2 font-bold">
                    Campaign Manager OS
                </p>
            </div>

            <Card className="w-full max-w-md border-gold/30 bg-shadow/90 shadow-2xl backdrop-blur-md p-8 animate-in zoom-in-95 duration-500">
                <div className="flex border-b border-gold/10 mb-6">
                    <button 
                        className={`flex-1 pb-2 text-sm font-cinzel font-bold tracking-wide transition-colors ${isLogin ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                        onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
                    >
                        Access Archives
                    </button>
                    <button 
                        className={`flex-1 pb-2 text-sm font-cinzel font-bold tracking-wide transition-colors ${!isLogin ? 'text-gold border-b-2 border-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
                        onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
                    >
                        Induct New Master
                    </button>
                </div>

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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="Email Identity" 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        placeholder="master@lumen.regnum"
                        className="bg-obsidian border-zinc-800 focus:border-violet"
                    />
                    <Input 
                        label="Secret Phrase" 
                        type="password" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-obsidian border-zinc-800 focus:border-violet"
                    />

                    <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Enter the Realm' : 'Forge Identity')}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[10px] text-zinc-600 font-serif italic">
                        "Only those who hold the key may shape the world."
                    </p>
                </div>
            </Card>

            <div className="mt-8 text-center text-zinc-700 text-xs">
                 <p>Secure. Private. Offline-Capable.</p>
            </div>
        </div>
    );
};
