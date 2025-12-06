
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Helper to safely get env vars (Vercel injects these automatically)
const getEnv = (key: string) => (import.meta as any).env?.[key];

// 1. Try Environment Variables (Priority for Vercel)
let supabaseUrl = getEnv('VITE_SUPABASE_URL');
let supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// 2. Fallback to LocalStorage (For local dev if not using .env file)
if (!supabaseUrl) {
    supabaseUrl = localStorage.getItem('dmos_supabase_url') || '';
}
if (!supabaseKey) {
    supabaseKey = localStorage.getItem('dmos_supabase_key') || '';
}

// 3. Validation Helper
export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey;
};

// 4. Safe Client Creation with Crash Protection
let client: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
    try {
        client = createClient(supabaseUrl.trim(), supabaseKey.trim());
    } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
        // We leave client as null so the UI can prompt for new credentials instead of crashing
    }
}

export const supabase = client;

// 5. Configuration Setter
export const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('dmos_supabase_url', url.trim());
    localStorage.setItem('dmos_supabase_key', key.trim());
    window.location.reload(); 
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('dmos_supabase_url');
    localStorage.removeItem('dmos_supabase_key');
    window.location.reload();
};

// 6. Test Connection
export const checkConnection = async (): Promise<{ success: boolean; message?: string }> => {
    if (!supabase) return { success: false, message: "Client not initialized" };
    
    try {
        // Try to fetch count of campaigns. This tests Auth (keys) and Storage (table existence)
        const { error, count } = await supabase
            .from('dmos_campaigns')
            .select('*', { count: 'exact', head: true });

        if (error) {
            // RLS might return an error if not logged in, but connection itself works if code isn't 500/Network
            if (error.code === 'PGRST301' || error.message.includes('JWT')) {
                 return { success: true }; // Connected, just needs auth
            }
            return { success: false, message: error.message };
        }
        return { success: true };
    } catch (e: any) {
         return { success: false, message: e.message };
    }
};

// --- AUTHENTICATION ---

export const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
};

export const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const resetPassword = async (email: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
    });
    if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });
    if (error) throw error;
};

export const deleteAccount = async () => {
    if (!supabase) throw new Error("Supabase not configured");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user logged in");
    
    // Usar a API de admin via RPC function ou deletar dados primeiro
    // Por segurança, vamos fazer signOut após tentar a deleção
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    
    await signOut();
};
