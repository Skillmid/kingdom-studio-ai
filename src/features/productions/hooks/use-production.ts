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

      const result = await supabase
        .from("productions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (result.error) {
        setError(
          result.error.code === "PGRST116"
            ? "The requested production could not be found."
            : "Unable to load production. Please try again."
        );
        setLoading(false);
        return;
      }

      setProduction(result.data);
      setError(null);
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