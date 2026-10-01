"use client";

import { useEffect, useState } from "react";

import type { StoryboardPanel } from "../types/storyboard-panel";

interface StoryboardPreviewDialogProps {
  open: boolean;
  panels: StoryboardPanel[];
  initialIndex?: number;
  onClose: () => void;
  onToggleApproval?: (panel: StoryboardPanel) => void;
  sceneHeadings?: ReadonlyMap<string, string>;
  shotLabels?: ReadonlyMap<string, string>;
  locationNames?: ReadonlyMap<string, string>;
}

export default function StoryboardPreviewDialog({
  open,
  panels,
  initialIndex = 0,
  onClose,
  onToggleApproval,
  sceneHeadings,
  shotLabels,
  locationNames,
}: StoryboardPreviewDialogProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep index within valid bounds whenever panels list changes
  const validIndex = panels.length === 0 ? 0 : Math.max(0, Math.min(panels.length - 1, activeIndex));
  const currentPanel: StoryboardPanel | undefined = panels[validIndex];

  // Auto-advance slideshow when playing
  useEffect(() => {
    if (!open || !isPlaying || panels.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % panels.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [open, isPlaying, panels.length]);

  // Keyboard controls for slideshow navigation and playback
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPlaying(false);
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % panels.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + panels.length) % panels.length);
      } else if (event.key === " ") {
        // Toggle play/pause on space bar unless focused on an interactive element
        const target = event.target as HTMLElement | null;
        if (target && ["button", "input", "textarea"].includes(target.tagName.toLowerCase())) {
          return;
        }
        event.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, panels.length, onClose]);

  if (!open || !currentPanel) return null;

  const sceneHeading = currentPanel.sceneId ? sceneHeadings?.get(currentPanel.sceneId) : undefined;
  const shotLabel = currentPanel.shotId ? shotLabels?.get(currentPanel.shotId) : undefined;
  const locationName = currentPanel.locationId ? locationNames?.get(currentPanel.locationId) : undefined;

  function handlePrev() {
    setActiveIndex((prev) => (prev - 1 + panels.length) % panels.length);
  }

  function handleNext() {
    setActiveIndex((prev) => (prev + 1) % panels.length);
  }

  function handleClose() {
    setIsPlaying(false);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Storyboard Flow Preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md md:p-8"
    >
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-yellow-500/20 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-yellow-400">
              Panel {validIndex + 1} of {panels.length}
            </span>
            <span className="text-sm font-semibold text-zinc-300">Sequence #{currentPanel.panelNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleApproval && (
              <button
                type="button"
                onClick={() => onToggleApproval(currentPanel)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  currentPanel.userApproved
                    ? "border border-yellow-500/50 bg-yellow-500/20 text-yellow-400"
                    : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-yellow-500/50 hover:text-yellow-400"
                }`}
              >
                <svg
                  className={`h-3.5 w-3.5 ${currentPanel.userApproved ? "text-yellow-400" : "text-zinc-500"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{currentPanel.userApproved ? "Approved" : "Approve"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Close preview"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main visual viewport */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
          {currentPanel.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPanel.imageUrl}
              alt={currentPanel.title || `Panel ${currentPanel.panelNumber}`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-yellow-500/70">
                Visual Continuity Draft
              </span>
              <p className="mt-3 text-lg font-bold text-white">
                {currentPanel.title || currentPanel.composition || `Panel ${currentPanel.panelNumber}`}
              </p>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-400">
                {currentPanel.visualDescription || "No still rendered yet. Generation jobs will render frames directly."}
              </p>
            </div>
          )}

          {/* Previous / Next overlay buttons */}
          {panels.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous panel"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700/60 bg-black/60 p-3 text-white backdrop-blur transition hover:bg-yellow-500 hover:text-black"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next panel"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700/60 bg-black/60 p-3 text-white backdrop-blur transition hover:bg-yellow-500 hover:text-black"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Panel metadata and context footer */}
        <div className="border-t border-zinc-800/80 bg-zinc-950 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {sceneHeading && <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">{sceneHeading}</span>}
                {shotLabel && <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">{shotLabel}</span>}
                {locationName && (
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">📍 {locationName}</span>
                )}
              </div>
              <h3 className="mt-2 text-base font-bold text-white">
                {currentPanel.title || currentPanel.visualDescription || "Panel Detail"}
              </h3>
              {currentPanel.composition && (
                <p className="mt-1 text-xs text-yellow-500/80">{currentPanel.composition}</p>
              )}
            </div>

            <div className="flex flex-col justify-end text-xs text-zinc-400">
              {currentPanel.continuityNotes && (
                <p className="line-clamp-2">
                  <span className="font-semibold text-zinc-300">Continuity: </span>
                  {currentPanel.continuityNotes}
                </p>
              )}
              {currentPanel.sourceEvidence && (
                <p className="mt-1 line-clamp-1">
                  <span className="font-semibold text-zinc-300">Source: </span>
                  {currentPanel.sourceEvidence}
                </p>
              )}
            </div>
          </div>

          {/* Controls scrubber and player row */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-zinc-900 pt-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  isPlaying
                    ? "bg-yellow-500 text-black hover:bg-yellow-400"
                    : "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {isPlaying ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    <span>Pause Flow</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Play Flow</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-zinc-500">Space to play/pause · Arrow keys to step</span>
            </div>

            {/* Scrubber dots */}
            <div className="flex max-w-full items-center gap-1 overflow-x-auto py-1">
              {panels.map((panel, idx) => (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  title={`Jump to panel ${panel.panelNumber}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === validIndex
                      ? "w-6 bg-yellow-400"
                      : panel.userApproved
                      ? "w-2.5 bg-yellow-500/50 hover:bg-yellow-400"
                      : "w-2.5 bg-zinc-700 hover:bg-zinc-500"
                  }`}
                  aria-label={`Jump to panel ${panel.panelNumber}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
