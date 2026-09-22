"use client";

import type { StoryBibleScreenplayProposal } from "../services/story-bible-screenplay-sync.service";

interface StoryBibleScreenplaySyncPanelProps {
  proposal: StoryBibleScreenplayProposal;
  screenplayTitle: string;
  screenplayVersion: number;
  onApply: () => void;
  onCancel: () => void;
}

const labels: Record<string, string> = {
  title: "Title",
  logline: "Logline",
  synopsis: "Synopsis",
  burden: "Creator Burden",
  truth: "Truth",
  human_problem: "Human Problem",
  theme: "Theme",
  core_message: "Core Message",
  scripture_foundation: "Scripture Foundation",
  kingdom_objective: "Kingdom Objective",
  target_audience: "Target Audience",
  genre: "Genre",
  tone: "Tone",
  language: "Language",
  visual_style: "Visual Style",
  aspect_ratio: "Aspect Ratio",
  duration_minutes: "Duration",
  universe: "Universe",
  time_period: "Time Period",
  primary_location: "Primary Location",
  beginning: "Beginning",
  conflict: "Central Conflict",
  midpoint: "Midpoint",
  climax: "Climax",
  ending: "Ending",
  ai_context: "AI Context",
  ai_rules: "AI Rules",
  forbidden_elements: "Forbidden Elements",
  preferred_vocabulary: "Preferred Vocabulary",
  visual_consistency: "Visual Consistency",
};

export default function StoryBibleScreenplaySyncPanel({
  proposal,
  screenplayTitle,
  screenplayVersion,
  onApply,
  onCancel,
}: StoryBibleScreenplaySyncPanelProps) {
  const entries = Object.entries(proposal).filter(
    ([, value]) => value !== undefined && value !== null && String(value).trim()
  );

  return (
    <section className="rounded-3xl border border-yellow-500/40 bg-yellow-500/5 p-6 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
            AI Sync Review
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Story Bible proposal from screenplay
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Source: {screenplayTitle} · Version {screenplayVersion}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold transition hover:border-zinc-500"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Apply Proposal
          </button>
        </div>
      </div>

      <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
        Nothing has been saved yet. Review the AI proposal, apply it to the editable Story Bible, then save when you are satisfied.
      </p>

      {entries.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-400">
          The screenplay did not provide enough evidence for a Story Bible proposal.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {labels[key] ?? key}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
