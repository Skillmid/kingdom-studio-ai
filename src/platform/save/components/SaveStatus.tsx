"use client";

import {
  useSave,
} from "../context/SaveContext";

export default function SaveStatus() {
  const {
    saving,
    savedAt,
    error,
  } = useSave();

  if (saving) {
    return (
      <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-400">
        Saving...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">
        Save failed
      </div>
    );
  }

  if (!savedAt) {
    return (
      <div className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400">
        Not saved this session
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-600/40 bg-green-600/10 px-4 py-2 text-sm text-green-400">
      Saved{" "}
      {savedAt.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}
    </div>
  );
}