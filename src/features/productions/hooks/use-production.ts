"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

import type { Production } from "../types/production";

export function useProduction(id: string) {
  const [production, setProduction] =
    useState<Production | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      console.log("Loading production:", id);

      const result = await supabase
        .from("productions")
        .select("*")
        .eq("id", id)
        .single();

      console.log("Supabase result:", result);

      if (result.error) {
        console.error(result.error);

        setError(JSON.stringify(result.error, null, 2));
        setLoading(false);
        return;
      }

      setProduction(result.data);
      setLoading(false);
    }

    load();
  }, [id]);

  return {
    production,
    loading,
    error,
  };
}