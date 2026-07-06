"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { productionRepository } from "../repositories/production.repository";
import type { Production } from "../types/production";

export type ProductionSort =
  | "updated"
  | "created"
  | "name";

export function useProductions() {
  const [productions, setProductions] =
    useState<Production[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState<ProductionSort>("updated");

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const result =
        await productionRepository.getAllIncludingArchived();

      setProductions(result);

      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load productions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function renameProduction(
    id: string,
    title: string
  ) {
    const updated =
      await productionRepository.rename(
        id,
        title
      );

    setProductions((current) =>
      current.map((production) =>
        production.id === id
          ? updated
          : production
      )
    );

    return updated;
  }

  async function duplicateProduction(
    id: string
  ) {
    const duplicate =
      await productionRepository.duplicate(
        id
      );

    setProductions((current) => [
      duplicate,
      ...current,
    ]);

    return duplicate;
  }

  async function archiveProduction(
    id: string
  ) {
    await productionRepository.archive(id);

    await refresh();
  }

  async function restoreProduction(
    id: string
  ) {
    await productionRepository.restore(id);

    await refresh();
  }

  async function deleteForever(
    id: string
  ) {
    await productionRepository.deleteForever(id);

    await refresh();
  }

  async function archiveAll() {
    await productionRepository.archiveAll();

    await refresh();
  }

  const filteredProductions =
    useMemo(() => {
      let list = [...productions];

      if (search.trim()) {
        const keyword =
          search.toLowerCase();

        list = list.filter((production) =>
          production.title
            .toLowerCase()
            .includes(keyword)
        );
      }

      switch (sort) {
        case "name":
          list.sort((a, b) =>
            a.title.localeCompare(b.title)
          );
          break;

        case "created":
          list.sort(
            (a, b) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          );
          break;

        default:
          list.sort(
            (a, b) =>
              new Date(
                b.updated_at
              ).getTime() -
              new Date(
                a.updated_at
              ).getTime()
          );
      }

      return list;
    }, [
      productions,
      search,
      sort,
    ]);

  const activeProductions =
    filteredProductions.filter(
      (production) =>
        production.deleted_at === null
    );

  const archivedProductions =
    filteredProductions.filter(
      (production) =>
        production.deleted_at !== null
    );

  return {
    loading,
    error,

    productions: activeProductions,

    activeProductions,

    archivedProductions,

    search,

    sort,

    setSearch,

    setSort,

    refresh,

    renameProduction,

    duplicateProduction,

    archiveProduction,

    restoreProduction,

    deleteForever,

    archiveAll,
  };
}