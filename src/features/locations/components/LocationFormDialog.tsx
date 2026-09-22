"use client";

import { useEffect, useMemo, useState } from "react";

import type { Location, LocationSetting, LocationStatus } from "../types/location";
import { locationSchema } from "../validation/location.schema";

interface LocationFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  productionId: string;
  location?: Location | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: {
    productionId: string;
    name: string;
    description?: string;
    setting: LocationSetting;
    notes?: string;
    status: LocationStatus;
    progress: number;
  }) => Promise<void>;
}

const STATUS_OPTIONS: Array<{ value: LocationStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const SETTING_OPTIONS: Array<{ value: LocationSetting; label: string }> = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "both", label: "Interior / Exterior" },
];

export default function LocationFormDialog({ open, mode, productionId, location, saving = false, onClose, onSubmit }: LocationFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [setting, setSetting] = useState<LocationSetting>("interior");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LocationStatus>("draft");
  const [progress, setProgress] = useState("0");
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && location) {
      setName(location.name);
      setDescription(location.description ?? "");
      setSetting(location.setting);
      setNotes(location.notes ?? "");
      setStatus(location.status);
      setProgress(String(location.progress));
    } else {
      setName("");
      setDescription("");
      setSetting("interior");
      setNotes("");
      setStatus("draft");
      setProgress("0");
    }
    setFieldError(null);
  }, [open, mode, location]);

  const parsedProgress = useMemo(() => Number(progress), [progress]);
  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const result = locationSchema.safeParse({
      productionId,
      name,
      description: description.trim() || undefined,
      setting,
      notes: notes.trim() || undefined,
      status,
      progress: Number.isFinite(parsedProgress) ? parsedProgress : NaN,
    });

    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Please check the location details.");
      return;
    }

    await onSubmit(result.data);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-16 max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">{mode === "edit" ? "Location" : "New Location"}</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{mode === "edit" ? "Edit Location" : "Add Location"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:text-white">Close</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Main House" autoFocus className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Setting</label>
              <select value={setting} onChange={(event) => setSetting(event.target.value as LocationSetting)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500">
                {SETTING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value as LocationStatus)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Description</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the place, set, or environment." rows={4} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Notes</label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Production notes, access details, continuity notes, etc." rows={3} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Progress ({progress || 0}%)</label>
            <input type="range" min={0} max={100} value={Number.isFinite(parsedProgress) ? parsedProgress : 0} onChange={(event) => setProgress(event.target.value)} className="w-full accent-yellow-500" />
          </div>

          {fieldError && <p className="rounded-xl bg-red-950/40 p-3 text-sm text-red-400">{fieldError}</p>}

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5">
            <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? (mode === "edit" ? "Saving..." : "Creating...") : (mode === "edit" ? "Save Location" : "Create Location")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
