import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { resolveServerSupabaseConfig, SupabaseConfigurationError } from "./config";

export async function createClient(accessToken?: string) {
  const config = resolveServerSupabaseConfig();
  if (!config) {
    throw new SupabaseConfigurationError();
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    ...(accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. src/proxy.ts refreshes and writes
          // Supabase auth cookies on the response before protected pages are rendered.
        }
      },
    },
  });
}
