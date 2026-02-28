/**
 * Supabase client
 *
 * Used as the data layer (DB operations only).
 * Authentication is handled via cookie-based tokens — NOT Supabase Auth.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '[Supabase] Missing env variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

/**
 * Quick health check — returns true if the Supabase REST API is reachable.
 * Uses a lightweight query (no real data read).
 */
export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "HEAD",
      headers: {
        apikey: SUPABASE_KEY,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error:
          "Invalid API key. Update VITE_SUPABASE_ANON_KEY in .env with the anon key from Supabase Dashboard → Settings → API.",
      };
    }
    return { ok: res.ok || res.status < 500 };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return {
        ok: false,
        error:
          "Connection timed out. Your Supabase project may be paused. Go to supabase.com/dashboard and restore it.",
      };
    }
    return {
      ok: false,
      error: `Cannot reach Supabase: ${err?.message || "Network error"}. Check your internet connection or Supabase project status.`,
    };
  }
}
