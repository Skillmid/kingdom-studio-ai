"use client";

import { useState } from "react";

import type { Asset } from "../types/asset";

interface DeleteAssetDialogProps {
  asset: Asset | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteAssetDialog({
  asset,
  open,
  loading = false,
  onClose,
  onDelete,
}: DeleteAssetDialogProps) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  if (!open || !asset) return null;

  async function handleDelete() {
    try {
      setWorking(true);
      setError("");
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete asset.");
    } finally {
      setWorking(false);
    }
  }

  const deleting = working || loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white">Delete Asset</h2>
        <p className="mt-5 leading-7 text-zinc-400">
          You are about to permanently delete
          <span className="font-semibold text-white"> {asset.title || asset.kind}</span>.
        </p>
        {error ? <p className="mt-5 rounded-xl bg-red-950/40 p-3 text-sm text-red-400">{error}</p> : null}
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" disabled={deleting} onClick={onClose} className="rounded-xl border border-zinc-700 px-5 py-2 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" disabled={deleting} onClick={handleDelete} className="rounded-xl bg-red-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
            {deleting ? "Deleting..." : "Delete Asset"}
          </button>
        </div>
      </div>
    </div>
  );
}
