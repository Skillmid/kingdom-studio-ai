import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

const FALLBACK_URL = "https://example.supabase.co";
const FALLBACK_KEY = "public-anon-key";

function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return createClient(FALLBACK_URL, FALLBACK_KEY);
  }

  return createSupabaseBrowserClient(url, key);
}

export const supabase = createBrowserClient();
