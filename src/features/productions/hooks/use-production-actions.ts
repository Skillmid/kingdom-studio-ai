"use client";

import { useProductions } from "./use-productions";

export function useProductionActions() {
  const {
    renameProduction,
    duplicateProduction,
    deleteProduction,
    archiveAll,
    refresh,
  } = useProductions();

  async function rename(
    id: string,
    title: string
  ) {
    return renameProduction(
      id,
      title
    );
  }

  async function duplicate(
    id: string
  ) {
    return duplicateProduction(id);
  }

  async function archive(
    id: string
  ) {
    return deleteProduction(id);
  }

  async function deleteAll() {
    return archiveAll();
  }

  return {
    rename,
    duplicate,
    archive,
    deleteAll,
    refresh,
  };
}