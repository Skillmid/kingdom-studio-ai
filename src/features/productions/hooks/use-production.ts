"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

import { productionRepository } from "../repositories/production.repository";
import type { Production } from "../types/production";

export function useProduction(id: string, initialProduction?: Production) {
  const [production, setProduction] = useState<Production | null>(initialProduction ?? null);
  const [loading, setLoading] = useState(!initialProduction);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduction?.id === id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await supabase
        .from("productions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (result.error) {
        setError(
          result.error.code === "PGRST116"
            ? "The requested production could not be found."
            : "Unable to load production. Please try again.",
        );
        setLoading(false);
        return;
      }

      setProduction(result.data);
      setError(null);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, initialProduction]);

  const updateProduction = useCallback(
    async (updates: Partial<Production>): Promise<Production> => {
      const updated = await productionRepository.update(id, updates);
      setProduction(updated);
      return updated;
    },
    [id],
  );

  return {
    production,
    loading,
    error,
    updateProduction,
  };
}
