import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Whether auth and database features can be used in this deployment. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Do not throw during module initialization when deployment env vars are absent.
// Throwing here prevents React from mounting at all and results in a blank page.
// A harmless local client lets the public routes render; AuthProvider skips calls
// to it until the real variables are supplied.
const clientUrl = supabaseUrl || 'https://placeholder.supabase.co';
const clientKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
