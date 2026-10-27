import { createClient } from '@supabase/supabase-js';

// Project credentials & fallbacks
const FALLBACK_SUPABASE_URL = 'https://merpldiljqqirpognrlp.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_ZJZ3JbP2ZJIrTh1VDm416A_aD2Q78cn';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Normalizes and validates the Supabase URL:
 * - Strips trailing `/rest/v1` or `/rest/v1/` (Supabase client appends this automatically)
 * - Verifies it is a valid HTTP/HTTPS URL
 * - Falls back to the known project URL if missing or malformed
 */
function normalizeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return FALLBACK_SUPABASE_URL;
  }
  const clean = url.trim().replace(/\/rest\/v1\/?$/, '');
  try {
    const parsed = new URL(clean);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return clean;
    }
  } catch {
    // Malformed URL, use fallback
  }
  return FALLBACK_SUPABASE_URL;
}

/**
 * Normalizes and validates the Supabase anon key:
 * - Strips enclosing brackets `[...]` if user input contained brackets
 * - Falls back to the known project key if missing or empty
 */
function normalizeKey(key) {
  if (typeof key !== 'string' || !key.trim()) {
    return FALLBACK_SUPABASE_ANON_KEY;
  }
  const clean = key.trim().replace(/^\[|\]$/g, '').trim();
  return clean || FALLBACK_SUPABASE_ANON_KEY;
}

const resolvedUrl = normalizeUrl(supabaseUrl);
const resolvedKey = normalizeKey(supabaseAnonKey);

let clientInstance;
try {
  clientInstance = createClient(resolvedUrl, resolvedKey);
} catch (err) {
  console.warn('Supabase initialization warning:', err);
  // Graceful dummy fallback to prevent unhandled script crashes in runtime environments
  clientInstance = {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  };
}

export const supabase = clientInstance;

// Expose on window for runtime debugging and compatibility with vanilla scripts
if (typeof window !== 'undefined') {
  window.supabaseClient = supabase;
  window._supabaseClientInstance = supabase;
  window.SUPABASE_URL = resolvedUrl;
  window.SUPABASE_ANON_KEY = resolvedKey;
}

export default supabase;
