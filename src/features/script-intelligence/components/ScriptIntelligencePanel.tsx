"use client";

import type {
  ScriptAnalysis,
} from "../types/script-analysis";

interface ScriptIntelligencePanelProps {
  analysis: ScriptAnalysis | null;

  processing: boolean;
}

export default function ScriptIntelligencePanel({
  analysis,
  processing,
}: ScriptIntelligencePanelProps) {
  if (processing) {
    return (
      <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        Analyzing screenplay...
      </aside>
    );
  }

  if (!analysis) {
    return (
      <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

        <h2 className="text-xl font-semibold">
          Script Intelligence
        </h2>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Import or enter a screenplay
          to begin story, character,
          spiritual, cultural, dialogue,
          and production analysis.
        </p>

      </aside>
    );
  }

  return (
    <aside className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div>

        <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
          Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Script Analysis
        </h2>

      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Genre
        </p>

        <p className="mt-1">
          {analysis.story.genre ||
            "Not identified"}
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Theme
        </p>

        <p className="mt-1">
          {analysis.story.theme ||
            "Not identified"}
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Spiritual Alignment
        </p>

        <p className="mt-1">
          {
            analysis.spirituality
              .biblicalAlignment
          }
          %
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Cultural Authenticity
        </p>

        <p className="mt-1">
          {
            analysis.culture
              .authenticity
          }
          %
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Dialogue
        </p>

        <p className="mt-1">
          {analysis.dialogue.score}%
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Production Complexity
        </p>

        <p className="mt-1">
          {analysis.production
            .complexity ||
            "Not evaluated"}
        </p>
      </div>

    </aside>
  );
}