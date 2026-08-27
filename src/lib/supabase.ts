import { createClient } from '@supabase/supabase-js';

// The anon key is intentionally public and safe to ship in browser code. Keep
// these fallbacks so preview/custom Vercel aliases still authenticate even when
// their environment-variable set is stale or incomplete.
const defaultSupabaseUrl = 'https://xguznwhlxhgriynloluj.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXpud2hseGhncml5bmxvbHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjEyNTUsImV4cCI6MjEwMDE5NzI1NX0.khnyKTwNhv-4Amgtf01iINUDOjcXdi_ENIxVJX9mKwA';
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || defaultSupabaseUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || defaultSupabaseAnonKey;

const authCallbackParams = ['code', 'access_token', 'refresh_token', 'error', 'error_description'];

export function isAuthCallbackUrl(url: string) {
  const parsedUrl = new URL(url);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));

  return (
    parsedUrl.pathname === '/auth/callback' ||
    authCallbackParams.some((param) => parsedUrl.searchParams.has(param) || hashParams.has(param))
  );
}

export const hadAuthCallbackInUrlOnLoad =
  typeof window !== 'undefined' && isAuthCallbackUrl(window.location.href);

/** Whether auth and database features can be used in this deployment. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Do not throw during module initialization when deployment env vars are absent.
// Throwing here prevents React from mounting at all and results in a blank page.
// A harmless local client lets the public routes render; AuthProvider skips calls
// to it until the real variables are supplied.
const clientUrl = supabaseUrl;
const clientKey = supabaseAnonKey;

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
