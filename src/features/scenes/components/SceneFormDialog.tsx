"use client";

import { useEffect, useMemo, useState } from "react";

import type { Scene, SceneStatus } from "../types/scene";
import { sceneSchema } from "../validation/scene.schema";

interface SceneFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  productionId: string;
  nextNumber: number;
  scene?: Scene | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    productionId: string;
    number: number;
    heading: string;
    summary?: string;
    characterIds: string[];
    status: SceneStatus;
    progress: number;
  }) => Promise<void>;
}

const STATUS_OPTIONS: Array<{ value: SceneStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function SceneFormDialog({
  open,
  mode,
  productionId,
  nextNumber,
  scene,
  saving = false,
  onClose,
  onSubmit,
}: SceneFormDialogProps) {
  const [number, setNumber] = useState(String(nextNumber));
  const [heading, setHeading] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<SceneStatus>("draft");
  const [progress, setProgress] = useState("0");
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && scene) {
      setNumber(String(scene.number));
      setHeading(scene.heading);
      setSummary(scene.summary ?? "");
      setStatus(scene.status);
      setProgress(String(scene.progress));
    } else {
      setNumber(String(nextNumber));
      setHeading("");
      setSummary("");
      setStatus("draft");
      setProgress("0");
    }

    setFieldError(null);
  }, [open, mode, scene, nextNumber]);

  const title = mode === "edit" ? "Edit Scene" : "Add Scene";
  const eyebrow = mode === "edit" ? "Scene Planner" : "New Scene";

  const parsedNumber = useMemo(() => Number(number), [number]);
  const parsedProgress = useMemo(() => Number(progress), [progress]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const payload = {
      productionId,
      number: Number.isFinite(parsedNumber) ? parsedNumber : NaN,
      heading,
      summary: summary.trim() ? summary.trim() : undefined,
      characterIds: scene?.characterIds ?? [],
      locationId: scene?.locationId,
      status,
      progress: Number.isFinite(parsedProgress) ? parsedProgress : NaN,
    };

    const result = sceneSchema.safeParse(payload);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setFieldError(firstIssue?.message ?? "Please check the scene details.");
      return;
    }

    await onSubmit({
      productionId: result.data.productionId,
      number: result.data.number,
      heading: result.data.heading,
      summary: result.data.summary,
      characterIds: result.data.characterIds,
      status: result.data.status,
      progress: result.data.progress,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-16 max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:text-white"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Scene Number
              </label>
              <input
                type="number"
                min={1}
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Status
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as SceneStatus)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Heading
            </label>
            <input
              value={heading}
              onChange={(event) => setHeading(event.target.value)}
              placeholder="INT. HOSPITAL ROOM — NIGHT"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="What happens in this scene?"
              rows={4}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Progress ({progress || 0}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Number.isFinite(parsedProgress) ? parsedProgress : 0}
              onChange={(event) => setProgress(event.target.value)}
              className="w-full accent-yellow-500"
            />
          </div>

          {fieldError && (
            <p className="rounded-xl bg-red-950/40 p-3 text-sm text-red-400">
              {fieldError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : mode === "edit"
                  ? "Save Scene"
                  : "Create Scene"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
