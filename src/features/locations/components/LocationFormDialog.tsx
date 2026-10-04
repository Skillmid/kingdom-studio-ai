"use client";

import { useMemo, useState } from "react";

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
    timePeriod?: string;
    weather?: string;
    architecture?: string;
    lighting?: string;
    mood?: string;
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

export default function LocationFormDialog(props: LocationFormDialogProps) {
  if (!props.open) return null;

  const formKey =
    props.mode === "edit" && props.location
      ? `edit-${props.location.id}`
      : "create";

  return <LocationFormDialogFields key={formKey} {...props} />;
}

function LocationFormDialogFields({
  mode,
  productionId,
  location,
  saving = false,
  onClose,
  onSubmit,
}: LocationFormDialogProps) {
  const [name, setName] = useState(mode === "edit" && location ? location.name : "");
  const [description, setDescription] = useState(
    mode === "edit" && location ? location.description ?? "" : ""
  );
  const [setting, setSetting] = useState<LocationSetting>(
    mode === "edit" && location ? location.setting : "interior"
  );
  const [timePeriod, setTimePeriod] = useState(mode === "edit" && location ? location.timePeriod ?? "" : "");
  const [weather, setWeather] = useState(mode === "edit" && location ? location.weather ?? "" : "");
  const [architecture, setArchitecture] = useState(mode === "edit" && location ? location.architecture ?? "" : "");
  const [lighting, setLighting] = useState(mode === "edit" && location ? location.lighting ?? "" : "");
  const [mood, setMood] = useState(mode === "edit" && location ? location.mood ?? "" : "");
  const [notes, setNotes] = useState(mode === "edit" && location ? location.notes ?? "" : "");
  const [status, setStatus] = useState<LocationStatus>(
    mode === "edit" && location ? location.status : "draft"
  );
  const [progress, setProgress] = useState(
    mode === "edit" && location ? String(location.progress) : "0"
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const parsedProgress = useMemo(() => Number(progress), [progress]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const result = locationSchema.safeParse({
      productionId,
      name,
      description: description.trim() || undefined,
      setting,
      timePeriod,
      weather,
      architecture,
      lighting,
      mood,
      notes: notes.trim() || undefined,
      status,
      progress: Number.isFinite(parsedProgress) ? parsedProgress : NaN,
    });

    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Please check the location details.");
      return;
    }

    try {
      await onSubmit(result.data);
    } catch (error) {
      setFieldError(error instanceof Error ? error.message : "Unable to save this location. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="location-form-title" className="mx-auto my-16 max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">{mode === "edit" ? "Location" : "New Location"}</p>
            <h2 id="location-form-title" className="mt-1 text-2xl font-bold text-white">{mode === "edit" ? "Edit Location" : "Add Location"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:text-white">Close</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="location-name" className="mb-2 block text-sm font-medium text-zinc-300">Name</label>
            <input id="location-name" value={name} onChange={(event) => { setName(event.target.value); setFieldError(null); }} placeholder="e.g. Main House" autoFocus required aria-invalid={fieldError ? true : undefined} aria-describedby={fieldError ? "location-form-error" : undefined} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="location-setting" className="mb-2 block text-sm font-medium text-zinc-300">Setting</label>
              <select id="location-setting" value={setting} onChange={(event) => setSetting(event.target.value as LocationSetting)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500">
                {SETTING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="location-status" className="mb-2 block text-sm font-medium text-zinc-300">Status</label>
              <select id="location-status" value={status} onChange={(event) => setStatus(event.target.value as LocationStatus)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <fieldset className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <legend className="px-2 text-sm font-semibold text-zinc-200">Environment Profile</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-300">
                Time Period
                <input value={timePeriod} onChange={(event) => setTimePeriod(event.target.value)} placeholder="e.g. Contemporary" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Weather
                <input value={weather} onChange={(event) => setWeather(event.target.value)} placeholder="e.g. Rainy season" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Architecture
                <textarea value={architecture} onChange={(event) => setArchitecture(event.target.value)} placeholder="Describe established architectural details." rows={2} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Lighting
                <input value={lighting} onChange={(event) => setLighting(event.target.value)} placeholder="e.g. Cool window light" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
              </label>
              <label className="block text-sm font-medium text-zinc-300 md:col-span-2">
                Mood
                <textarea value={mood} onChange={(event) => setMood(event.target.value)} placeholder="Describe the intended atmosphere." rows={2} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
              </label>
            </div>
          </fieldset>

          <div>
            <label htmlFor="location-description" className="mb-2 block text-sm font-medium text-zinc-300">Description</label>
            <textarea id="location-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the place, set, or environment." rows={4} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
          </div>

          <div>
            <label htmlFor="location-notes" className="mb-2 block text-sm font-medium text-zinc-300">Notes</label>
            <textarea id="location-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Production notes, access details, continuity notes, etc." rows={3} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500" />
          </div>

          <div>
            <label htmlFor="location-progress" className="mb-2 block text-sm font-medium text-zinc-300">Progress ({progress || 0}%)</label>
            <input id="location-progress" type="range" min={0} max={100} value={Number.isFinite(parsedProgress) ? parsedProgress : 0} onChange={(event) => setProgress(event.target.value)} className="w-full accent-yellow-500" />
          </div>

          {fieldError && <p id="location-form-error" role="alert" className="rounded-xl bg-red-950/40 p-3 text-sm text-red-400">{fieldError}</p>}

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
