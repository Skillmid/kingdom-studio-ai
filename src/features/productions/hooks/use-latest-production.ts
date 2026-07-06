"use client";

import { useEffect, useState } from "react";

import { productionRepository } from "../repositories/production.repository";

import type { Production } from "../types/production";

export function useLatestProduction() {
  const [production, setProduction] =
    useState<Production | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const productions =
          await productionRepository.getAll();

        setProduction(
          productions.length > 0
            ? productions[0]
            : null
        );

        setError(null);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load production."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return {
    production,
    loading,
    error,
  };
}