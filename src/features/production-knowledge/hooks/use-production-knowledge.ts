"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  productionKnowledgeRepository,
} from "../repositories/production-knowledge.repository";

import type {
  ProductionKnowledge,
} from "../types/production-knowledge";

export function useProductionKnowledge(
  productionId: string
) {
  const [
    knowledge,
    setKnowledge,
  ] =
    useState<ProductionKnowledge | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      const result =
        await productionKnowledgeRepository.get(
          productionId
        );

      setKnowledge(result);

      setLoading(false);
    }

    load();
  }, [productionId]);

  return {
    knowledge,
    loading,
  };
}