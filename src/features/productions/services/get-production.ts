import { supabase } from "@/lib/supabase/client";

export async function getProduction(id: string) {
  const { data, error } = await supabase
    .from("productions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}