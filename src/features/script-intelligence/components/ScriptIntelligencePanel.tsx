"use client";

import type {
  ScriptAnalysis,
} from "../types/script-analysis";

interface ScriptAnalysisPanelProps {
  analysis: ScriptAnalysis | null;

  processing: boolean;

  onAnalyse: () => Promise<void>;
}

export default function ScriptAnalysisPanel({
  analysis,
  processing,
  onAnalyse,
}: ScriptAnalysisPanelProps) {
  if (processing) {
    return (
      <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        Analyzing screenplay...
      </aside>
    );
  }

  return (
    <aside className="space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
          Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Script Intelligence
        </h2>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Analyze the screenplay while
          preserving the creator&apos;s
          authority over every revision.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled={processing}
          onClick={() =>
            void onAnalyse()
          }
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left transition hover:border-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <p className="font-semibold">
            Analyse Screenplay
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Complete comprehensive screenplay analysis and metrics.
          </p>
        </button>
      </div>

      {analysis && (
        <section className="space-y-4 border-t border-zinc-800 pt-6">

          <h3 className="font-semibold">
            Analysis Snapshot
          </h3>

          <div>
            <p className="text-sm text-zinc-500">
              Genre
            </p>

            <p className="mt-1">
              {analysis.story?.genre ||
                "Not identified"}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">
              Theme
            </p>

            <p className="mt-1">
              {analysis.story?.theme ||
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
                  ?.biblicalAlignment
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
                  ?.authenticity
              }
              %
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">
              Professional
            </p>

            <p className="mt-1">
              {
                analysis.professional
                  ?.score
              }
              %
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">
              Dialogue
            </p>

            <p className="mt-1">
              {
                analysis.dialogue
                  ?.score
              }
              %
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">
              Production Complexity
            </p>

            <p className="mt-1">
              {analysis.production
                ?.complexity ||
                "Not evaluated"}
            </p>
          </div>

        </section>
      )}

    </aside>
  );
}