/**
 * Shared validation and safe fallback for browser-side Supabase configuration.
 *
 * Public Supabase publishable keys are intended for browser use. Database access
 * must still be protected by Supabase Row Level Security policies.
 */

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export function resolveSupabaseConfig(
  rawUrl: string | undefined,
  rawPublishableKey: string | undefined,
): SupabaseConfig | null {
  const url = rawUrl?.trim();
  const publishableKey = rawPublishableKey?.trim();

  if (!url || !publishableKey) return null;

  try {
    const parsed = new URL(url);
    const isLocalSupabase =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const isSupabaseHost =
      parsed.hostname.endsWith(".supabase.co") ||
      parsed.hostname.endsWith(".supabase.in");

    if (
      (parsed.protocol !== "https:" && !isLocalSupabase) ||
      (!isLocalSupabase && !isSupabaseHost) ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    return {
      url: parsed.origin,
      publishableKey,
    };
  } catch {
    return null;
  }
}

/**
 * A deterministic response prevents requests from reaching an invalid host
 * when the app is intentionally running without Supabase configuration.
 */
export const notConfiguredFetch: typeof fetch = async () =>
  new Response(
    JSON.stringify({
      message: SUPABASE_NOT_CONFIGURED_MESSAGE,
      error: "SUPABASE_NOT_CONFIGURED",
    }),
    {
      status: 503,
      headers: { "content-type": "application/json" },
    },
  );
