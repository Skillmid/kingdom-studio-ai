import { cache } from "react";

import { getAuthenticatedUser } from "./authenticated-user";
import { createClient } from "@/lib/supabase/server";

/** Reuse the verified cookie-backed session and Supabase client across nested layouts per request. */
export const getServerAccess = cache(async () => {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(() => supabase.auth.getClaims());
  return { supabase, user };
});
