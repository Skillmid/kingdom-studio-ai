import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { resolveServerSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const config = resolveServerSupabaseConfig();

  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  // Refreshes a valid session and updates request/response cookies. The protected
  // server layout still verifies claims and production ownership before rendering.
  try {
    await supabase.auth.getUser();
  } catch {
    // The layout fails closed if verification is unavailable or the session is invalid.
  }

  return response;
}

export const config = {
  matcher: ["/studio/:path*"],
};
