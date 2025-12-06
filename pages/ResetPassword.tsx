import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../services/supabase';
import { Button, Input, Card } from '../components/ui';
import { Crown, AlertCircle, CheckCircle } from 'lucide-react';

export const ResetPassword: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate password length
            if (newPassword.length < 6) {
                setError("Secret Phrase must be at least 6 characters long.");
                setLoading(false);
                return;
            }

            // Validate passwords match
            if (newPassword !== confirmPassword) {
                setError("Secret Phrases do not match. Please verify and try again.");
                setLoading(false);
                return;
            }

            await updatePassword(newPassword);
            setSuccess(true);
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
                <div className="absolute inset-0 m-auto w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px] pointer-events-none z-0"></div>
                
                <div className="relative z-10 mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <Crown className="w-12 h-12 text-gold mx-auto mb-4 drop-shadow-lg" />
                    <h1 className="text-4xl font-cinzel font-bold text-gold tracking-[0.25em] drop-shadow-md">
                        LUMEN REGNUM
                    </h1>
                </div>

                <Card className="relative z-10 w-full max-w-md border-gold/30 bg-shadow/95 shadow-2xl backdrop-blur-md p-8 animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                        <h2 className="text-2xl font-cinzel font-bold text-gold mb-2">Password Updated!</h2>
                        <p className="text-zinc-400 text-sm">Your Secret Phrase has been successfully changed.</p>
                        <p className="text-zinc-500 text-xs mt-4">Redirecting to login...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 m-auto w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px] pointer-events-none z-0"></div>

            <div className="relative z-10 mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <Crown className="w-12 h-12 text-gold mx-auto mb-4 drop-shadow-lg" />
                <h1 className="text-4xl font-cinzel font-bold text-gold tracking-[0.25em] drop-shadow-md">
                    LUMEN REGNUM
                </h1>
                <p className="text-[#7E8299] text-xs uppercase tracking-[0.3em] mt-3 font-bold">
                    Reset Your Secret Phrase
                </p>
            </div>

            <Card className="relative z-10 w-full max-w-md border-gold/30 bg-shadow/95 shadow-2xl backdrop-blur-md p-8 animate-in zoom-in-95 duration-500">
                {error && (
                    <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-300">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        label="New Secret Phrase" 
                        type="password" 
                        required 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-obsidian border-zinc-800 focus:border-violet"
                        autoFocus
                    />
                    
                    <Input 
                        label="Confirm New Secret Phrase" 
                        type="password" 
                        required 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-obsidian border-zinc-800 focus:border-violet"
                    />

                    <Button 
                        type="submit" 
                        className="w-full mt-2" 
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Secret Phrase'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-zinc-500 font-serif italic opacity-70">
                        "With new words of power, you may enter once more."
                    </p>
                </div>
            </Card>

            <div className="relative z-10 mt-8 text-center text-zinc-700 text-xs">
                <p>Secure. Private. Protected.</p>
            </div>
        </div>
    );
};
