
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Vite exposes env vars via import.meta.env (typed via vite/client)
const getEnv = (key: string): string => (import.meta.env?.[key] as string) ?? '';

// 1. Try Environment Variables (Priority for Vercel)
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Credentials saved by older versions of the app are no longer used.
try {
    localStorage.removeItem('dmos_supabase_url');
    localStorage.removeItem('dmos_supabase_key');
} catch { /* ignore */ }

// 2. Validation Helper
export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey;
};

// 3. Safe Client Creation with Crash Protection
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

// 4. Test Connection
export const checkConnection = async (): Promise<{ success: boolean; message?: string }> => {
    if (!supabase) return { success: false, message: "Client not initialized" };
    
    try {
        // Try to fetch count of campaigns. This tests Auth (keys) and Storage (table existence)
        const { error, count } = await supabase
            .from('dmos_campaigns')
            .select('*', { count: 'exact', head: true });

        if (error) {
            // RLS might return an error if not logged in, but connection itself works if code isn't 500/Network.
            // 42501 = "permission denied": the anon role has no table grants, so the server was reached.
            if (error.code === 'PGRST301' || error.code === '42501' || error.message.includes('JWT')) {
                 return { success: true }; // Connected, just needs auth
            }
            return { success: false, message: error.message };
        }
        return { success: true };
    } catch (e: unknown) {
         return { success: false, message: e instanceof Error ? e.message : String(e) };
    }
};

// --- AUTHENTICATION ---

// Sign-up is invite-only. The code travels as user metadata and is validated SERVER-SIDE by a
// trigger on auth.users (see supabase/migrations/017_invite_codes.sql); the trigger removes it
// from the metadata afterwards. Without a valid code the account is never created.
export const signUp = async (email: string, password: string, inviteCode: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { invite_code: inviteCode } },
    });
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
    
    // Use admin API via RPC function to delete the user
    // Sign out after deletion for security
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    
    await signOut();
};
