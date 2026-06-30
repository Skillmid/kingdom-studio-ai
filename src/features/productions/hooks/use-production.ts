"use client";

import { useEffect, useState } from "react";

import { getProduction } from "../services/get-production";

import type { Production } from "../types/production";

export function useProduction(id: string) {
  const [production, setProduction] =
    useState<Production | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result =
          await getProduction(id);

        setProduction(result);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  return {
    production,
    loading,
  };
}