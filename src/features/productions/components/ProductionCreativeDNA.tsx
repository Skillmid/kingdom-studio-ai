"use client";

import { useId, useState } from "react";

import {
  ASPECT_RATIOS,
  type AspectRatioOption,
  VISUAL_FORMATS,
  type VisualFormat,
} from "../types/creative-dna";
import type { Production } from "../types/production";
import {
  getProductionCreativeDNA,
  normalizeAspectRatio,
  resolveAspectRatioOption,
} from "../services/production-creative-dna";

interface ProductionCreativeDNAProps {
  production: Production;
  onUpdate?: (updates: Partial<Production>) => Promise<Production>;
}

export default function ProductionCreativeDNA({
  production,
  onUpdate,
}: ProductionCreativeDNAProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selectedFormat, setSelectedFormat] = useState<string>(
    production.art_style ?? "Cinematic Realism",
  );
  const [customFormat, setCustomFormat] = useState<string>(
    production.art_style &&
      !VISUAL_FORMATS.includes(production.art_style as VisualFormat)
      ? production.art_style
      : "",
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    Boolean(
      production.art_style &&
        !VISUAL_FORMATS.includes(production.art_style as VisualFormat),
    ),
  );
  const [selectedRatio, setSelectedRatio] = useState<string>(
    normalizeAspectRatio(production.aspect_ratio),
  );

  const customFormatInputId = useId();

  const dna = getProductionCreativeDNA(production);
  const activeRatioOption: AspectRatioOption = resolveAspectRatioOption(
    isEditing ? selectedRatio : production.aspect_ratio,
  );

  function handleStartEditing() {
    setSelectedFormat(production.art_style ?? "Cinematic Realism");
    setSelectedRatio(normalizeAspectRatio(production.aspect_ratio));
    const isCustom = Boolean(
      production.art_style &&
        !VISUAL_FORMATS.includes(production.art_style as VisualFormat),
    );
    setIsCustomMode(isCustom);
    setCustomFormat(isCustom ? (production.art_style ?? "") : "");
    setError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    if (!onUpdate) return;

    const finalArtStyle = (
      isCustomMode ? customFormat.trim() : selectedFormat.trim()
    ) || null;

    try {
      setSaving(true);
      setError(null);
      await onUpdate({
        art_style: finalArtStyle,
        aspect_ratio: selectedRatio,
      });
      setNotice("Production visual direction updated.");
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save creative direction.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-500">
            Creative DNA • Canonical Standard
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Creative Direction & Visual Identity
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Establish the canonical visual language, animation or live-action format,
            and framing standard for this production. All downstream character
            references, location environments, storyboards, and media generations
            inherit this direction.
          </p>
        </div>

        {!isEditing && onUpdate && (
          <button
            type="button"
            onClick={handleStartEditing}
            className="self-start rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-2.5 text-xs font-bold text-yellow-400 transition hover:bg-yellow-500/20"
          >
            Edit Creative Direction
          </button>
        )}
      </div>

      {/* Creator Authority Principles Banner */}
      <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs leading-5 text-zinc-300">
        <span className="font-bold text-yellow-400">Creator Decision: </span>
        This production&apos;s visual direction guides future creative and generation
        decisions. AI assists with continuity, but does not alter your direction.
        Changing settings here will guide future assets; existing approved assets
        remain untouched.
      </div>

      {notice && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-zinc-400 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-zinc-400 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content: View Mode vs Edit Mode */}
      {!isEditing ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Card 1: Visual Format */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Visual Format & Style
              </p>
              <h3 className="mt-3 text-xl font-bold text-white">
                {dna.artStyle || "Unspecified"}
              </h3>
              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {dna.artStyle
                  ? "Production aesthetic applied to scenes, shot coverage, and visual prompts."
                  : "No visual format established. Set your format to guide character and asset generation."}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[11px] font-semibold text-yellow-400">
                ✦ Canonical Visual Style
              </span>
            </div>
          </div>

          {/* Card 2: Aspect Ratio & Framing */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Framing Standard
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <h3 className="text-xl font-bold text-white">
                  {activeRatioOption.label}
                </h3>
                <span className="text-xs text-zinc-400">
                  {activeRatioOption.description}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-400">
                Camera aspect ratio enforced across storyboards, panels, and renders.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-[11px] font-medium text-zinc-300">
                Framing: {dna.aspectRatio}
              </span>
            </div>
          </div>

          {/* Card 3: Interactive Framing Preview */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-4">
              Frame Geometry Preview
            </p>
            <div className="relative flex h-28 w-44 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-2">
              <div
                className="flex items-center justify-center rounded-lg border-2 border-yellow-500/80 bg-yellow-500/10 transition-all duration-300"
                style={{
                  width:
                    activeRatioOption.ratioWidth >= activeRatioOption.ratioHeight
                      ? "100%"
                      : `${Math.round((activeRatioOption.ratioWidth / activeRatioOption.ratioHeight) * 100)}%`,
                  height:
                    activeRatioOption.ratioHeight >= activeRatioOption.ratioWidth
                      ? "100%"
                      : `${Math.min(100, Math.round((activeRatioOption.ratioHeight / activeRatioOption.ratioWidth) * 100))}%`,
                  maxHeight: "85px",
                }}
              >
                <span className="text-[10px] font-black tracking-wider text-yellow-400">
                  {activeRatioOption.label}
                </span>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-zinc-500">
              Render targets match this frame profile
            </p>
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <div className="mt-8 space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Visual Format & Style
            </label>
            <p className="text-xs text-zinc-400 mb-4">
              Choose a standard visual format or provide custom aesthetic direction for this production.
            </p>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {VISUAL_FORMATS.map((format) => {
                const isSelected = !isCustomMode && selectedFormat === format;
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setSelectedFormat(format);
                    }}
                    className={`rounded-xl border p-3.5 text-left text-xs font-semibold transition ${
                      isSelected
                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.08)]"
                        : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{format}</span>
                      {isSelected && <span className="text-yellow-400">✓</span>}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`rounded-xl border p-3.5 text-left text-xs font-semibold transition ${
                  isCustomMode
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.08)]"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Custom Style...</span>
                  {isCustomMode && <span className="text-yellow-400">✓</span>}
                </div>
              </button>
            </div>

            {isCustomMode && (
              <div className="mt-4">
                <label
                  htmlFor={customFormatInputId}
                  className="mb-1 block text-xs font-medium text-zinc-300"
                >
                  Custom Visual Style Description
                </label>
                <input
                  id={customFormatInputId}
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value)}
                  placeholder="e.g. Gritty 1970s Technicolor, Neo-Noir Watercolor"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500 placeholder:text-zinc-600"
                />
              </div>
            )}
          </div>

          {/* Aspect Ratio Selection */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Framing Standard (Aspect Ratio)
            </label>
            <p className="text-xs text-zinc-400 mb-4">
              Select the native capture and delivery aspect ratio for all shots in this production.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ASPECT_RATIOS.map((option) => {
                const isSelected = selectedRatio === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedRatio(option.value)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.08)]"
                        : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold">{option.label}</span>
                      {isSelected && <span className="text-yellow-400 text-xs">✓</span>}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-yellow-500 px-6 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Creative Direction"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

