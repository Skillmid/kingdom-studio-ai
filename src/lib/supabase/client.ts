import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { notConfiguredFetch, resolveSupabaseConfig, SUPABASE_NOT_CONFIGURED_MESSAGE } from "./config";

/** Reserved, non-resolvable host used only when configuration is missing; requests never leave the browser. */
const NOT_CONFIGURED_URL = "https://supabase-not-configured.invalid";

const config = resolveSupabaseConfig(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const isSupabaseConfigured = config !== null;

function createBrowserClient(): SupabaseClient {
  if (!config) {
    if (typeof window !== "undefined") {
      console.error(SUPABASE_NOT_CONFIGURED_MESSAGE);
    }
    return createClient(NOT_CONFIGURED_URL, "not-configured", {
      global: { fetch: notConfiguredFetch },
    });
  }

  return createSupabaseBrowserClient(config.url, config.publishableKey);
}

export const supabase = createBrowserClient();
