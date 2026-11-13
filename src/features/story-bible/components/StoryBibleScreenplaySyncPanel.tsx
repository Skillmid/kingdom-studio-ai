"use client";

import type { ProposalFieldReview } from "../services/story-bible-proposal-merge";

interface StoryBibleScreenplaySyncPanelProps {
  reviews: ProposalFieldReview[];
  selectedFields: ReadonlySet<string>;
  onToggleField: (key: string, checked: boolean) => void;
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
  reviews,
  selectedFields,
  onToggleField,
  screenplayTitle,
  screenplayVersion,
  onApply,
  onCancel,
}: StoryBibleScreenplaySyncPanelProps) {
  const entries = reviews.filter((review) => review.status !== "same");
  const unchangedCount = reviews.length - entries.length;
  const selectedCount = entries.filter((review) => selectedFields.has(review.key)).length;

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
            disabled={selectedCount === 0}
            className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply {selectedCount} selected field{selectedCount === 1 ? "" : "s"}
          </button>
        </div>
      </div>

      <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
        Nothing has been saved yet. Empty fields are pre-selected. Fields you have already written are
        never replaced unless you tick them. Apply the selected fields to the editable Story Bible, then save
        when you are satisfied.
        {unchangedCount > 0 ? ` ${unchangedCount} proposed value${unchangedCount === 1 ? " matches" : "s match"} what you already have.` : ""}
      </p>

      {entries.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-400">
          The screenplay did not provide enough evidence for a Story Bible proposal.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {entries.map((review) => {
            const checked = selectedFields.has(review.key);
            return (
              <label
                key={review.key}
                className={`block cursor-pointer rounded-2xl border bg-zinc-950 p-5 ${checked ? "border-yellow-500/60" : "border-zinc-800"}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {labels[review.key] ?? review.key}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-zinc-400">
                    {review.status === "conflict" ? "Replaces your value" : "Fills empty field"}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onToggleField(review.key, event.target.checked)}
                      aria-label={`Apply proposed ${labels[review.key] ?? review.key}`}
                    />
                  </span>
                </span>
                <span className="mt-3 block whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                  {String(review.proposed)}
                </span>
                {review.status === "conflict" && (
                  <span className="mt-3 block whitespace-pre-wrap border-t border-zinc-800 pt-3 text-xs leading-5 text-zinc-500">
                    Your current value: {String(review.current)}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
