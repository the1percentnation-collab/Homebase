import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let cacheChecked = false;

function resolveEnv(): { url?: string; anonKey?: string } {
  // NEXT_PUBLIC_ vars are inlined at build time for the browser, and also
  // available server-side in Next.js.
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

// Returns a configured client, or null when env vars aren't set. Callers
// should treat a null return as "cloud not configured; fall back to local".
export function getSupabaseClient(): SupabaseClient | null {
  if (cacheChecked) return cachedClient;
  cacheChecked = true;

  const { url, anonKey } = resolveEnv();
  if (!url || !anonKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = resolveEnv();
  return Boolean(url && anonKey);
}
