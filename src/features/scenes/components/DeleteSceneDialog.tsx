"use client";

import { useState } from "react";

import type { Scene } from "../types/scene";

interface DeleteSceneDialogProps {
  scene: Scene | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteSceneDialog({
  scene,
  open,
  loading = false,
  onClose,
  onDelete,
}: DeleteSceneDialogProps) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  if (!open || !scene) {
    return null;
  }

  async function handleDelete() {
    try {
      setWorking(true);
      setError("");
      await onDelete();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete scene.",
      );
    } finally {
      setWorking(false);
    }
  }

  const deleting = working || loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white">Delete Scene</h2>

        <p className="mt-5 leading-7 text-zinc-400">
          You are about to permanently delete
          <span className="font-semibold text-white">
            {" "}
            Scene {scene.number}: {scene.heading}
          </span>
          .
        </p>

        <p className="mt-3 text-sm text-zinc-500">
          This cannot be undone from Scene Planner v1.
        </p>

        {error && (
          <p className="mt-5 rounded-xl bg-red-950/40 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-5 py-2 transition hover:border-zinc-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="rounded-xl bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Scene"}
          </button>
        </div>
      </div>
    </div>
  );
}
