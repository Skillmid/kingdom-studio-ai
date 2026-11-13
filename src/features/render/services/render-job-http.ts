import type { SupabaseClient } from "@supabase/supabase-js";

import { bearerToken } from "@/lib/http/json-body";
import { createClient } from "@/lib/supabase/server";

export async function getRenderRequestContext(request: Request) {
  const token = bearerToken(request);
  const supabase = await createClient(token);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { supabase, user };
}

export type ProductionAccessResult =
  | { ok: true; production: { id: string; owner_id: string } }
  | { ok: false; status: 403 | 404; error: string };

export async function verifyRenderProductionAccess(
  supabase: SupabaseClient,
  productionId: string,
  userId: string,
): Promise<ProductionAccessResult> {
  const { data, error } = await supabase
    .from("productions")
    .select("id, owner_id")
    .eq("id", productionId)
    .maybeSingle();
  if (error) throw new Error(`Unable to verify production access: ${error.message}`);
  if (!data) return { ok: false, status: 404, error: "Production not found or inaccessible." };
  if (data.owner_id !== userId) return { ok: false, status: 403, error: "Access denied for this production." };
  return { ok: true, production: data };
}
