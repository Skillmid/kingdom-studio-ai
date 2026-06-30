"use client";

import { useEffect, useState } from "react";

import { productionRepository } from "../repositories/production.repository";

import type { Production } from "../types/production";

export function useProductions() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProductions() {
    try {
      const data =
        await productionRepository.getAll();

      setProductions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductions();
  }, []);

  return {
    productions,
    loading,
    reload: loadProductions,
  };
}