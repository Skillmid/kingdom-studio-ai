"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Production } from "../types/production";

import ProductionCardMenu from "./ProductionCardMenu";
import DeleteProductionDialog from "./DeleteProductionDialog";
import RenameProductionDialog from "./RenameProductionDialog";

interface ProductionCardProps {
  production: Production;
  onDeleted: () => Promise<void>;
  onRenamed: (title: string) => Promise<void>;
  onDuplicated: () => Promise<Production>;
}

export default function ProductionCard({
  production,
  onDeleted,
  onRenamed,
  onDuplicated,
}: ProductionCardProps) {
  const router = useRouter();

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [renameOpen, setRenameOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  function openProduction() {
    router.push(
      `/studio/productions/${production.id}`
    );
  }

  async function handleDelete() {
    setLoading(true);

    try {
      await onDeleted();
      setDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(
    title: string
  ) {
    setLoading(true);

    try {
      await onRenamed(title);
      setRenameOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate() {
    setLoading(true);

    try {
      const duplicate =
        await onDuplicated();

      router.push(
        `/studio/productions/${duplicate.id}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="group relative rounded-3xl border border-zinc-800 bg-zinc-900 transition duration-300 hover:border-yellow-500 hover:shadow-xl">

        <div className="flex items-start justify-between p-6">

          <div className="min-w-0 flex-1">

            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
              {production.status}
            </p>

            <h3 className="mt-3 truncate text-2xl font-semibold">
              {production.title}
            </h3>

            <p className="mt-4 text-sm text-zinc-400">
              Updated{" "}
              {new Date(
                production.updated_at
              ).toLocaleDateString()}
            </p>

          </div>

          <ProductionCardMenu
            onOpen={openProduction}
            onRename={() =>
              setRenameOpen(true)
            }
            onDuplicate={
              handleDuplicate
            }
            onDelete={() =>
              setDeleteOpen(true)
            }
          />

        </div>

        <button
          type="button"
          onClick={openProduction}
          className="flex w-full items-center justify-between border-t border-zinc-800 px-6 py-4 transition hover:bg-zinc-800"
        >
          <span className="font-medium">
            Open Production
          </span>

          <span className="text-xl transition group-hover:translate-x-1">
            →
          </span>

        </button>

      </div>

      <RenameProductionDialog
        open={renameOpen}
        title={production.title}
        loading={loading}
        onClose={() =>
          setRenameOpen(false)
        }
        onRename={handleRename}
      />

      <DeleteProductionDialog
        productionTitle={production.title}
        open={deleteOpen}
        loading={loading}
        onClose={() =>
          setDeleteOpen(false)
        }
        onDelete={handleDelete}
      />

    </>
  );
}