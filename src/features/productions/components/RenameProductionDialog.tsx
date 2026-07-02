"use client";

import { useEffect, useState } from "react";

interface RenameProductionDialogProps {
  open: boolean;
  title: string;
  loading?: boolean;
  onClose: () => void;
  onRename: (title: string) => Promise<void>;
}

export default function RenameProductionDialog({
  open,
  title,
  loading = false,
  onClose,
  onRename,
}: RenameProductionDialogProps) {
  const [value, setValue] =
    useState(title);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setValue(title);
  }, [title]);

  if (!open) {
    return null;
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!value.trim()) {
      setError(
        "Production title is required."
      );
      return;
    }

    try {
      setWorking(true);
      setError("");

      await onRename(value.trim());

      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to rename production."
      );
    } finally {
      setWorking(false);
    }
  }

  const saving =
    loading || working;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">

        <h2 className="text-2xl font-bold">
          Rename Production
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >

          <input
            value={value}
            onChange={(e) =>
              setValue(e.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-yellow-500"
          />

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-700 px-5 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-black"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}