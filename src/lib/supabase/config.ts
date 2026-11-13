export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for this environment.";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(SUPABASE_NOT_CONFIGURED_MESSAGE);
    this.name = "SupabaseConfigurationError";
  }
}

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

/**
 * Returns the public Supabase config or null when it is missing/blank.
 * Callers pass the values explicitly so Next.js can inline NEXT_PUBLIC_* at build time.
 */
export function resolveSupabaseConfig(url: string | undefined, publishableKey: string | undefined): SupabasePublicConfig | null {
  const trimmedUrl = url?.trim();
  const trimmedKey = publishableKey?.trim();
  if (!trimmedUrl || !trimmedKey) return null;
  return { url: trimmedUrl, publishableKey: trimmedKey };
}

/**
 * Resolves Supabase config dynamically for server environments without build-time inlining.
 * Reads runtime process.env so that test environments (e.g. Playwright E2E mock server)
 * and runtime overrides are honored by server components and middleware.
 */
export function resolveServerSupabaseConfig(): SupabasePublicConfig | null {
  const env = process.env;
  return resolveSupabaseConfig(
    env["SUPABASE_URL"] ?? env["NEXT_PUBLIC_SUPABASE_URL"],
    env["SUPABASE_PUBLISHABLE_KEY"] ?? env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  );
}

/**
 * A fetch that fails every request with a clear configuration error. Used by the browser client
 * when env is missing so the app still renders (and `next build` can prerender static shells)
 * while every Supabase call fails loudly instead of silently talking to a placeholder project.
 */
export const notConfiguredFetch: typeof fetch = async () => {
  throw new SupabaseConfigurationError();
};
