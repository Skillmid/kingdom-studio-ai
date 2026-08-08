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
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
            Intelligence
          </p>

          <h2 className="text-2xl font-bold">
            Analysing Screenplay
          </h2>

          <p className="text-sm leading-6 text-zinc-400">
            Kingdom Studio AI is examining the screenplay across story,
            characters, dialogue, spirituality, culture, professional
            quality, scenes, and production readiness.
          </p>

          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-yellow-500" />
          </div>
        </div>
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
          A professional screenplay intelligence layer that helps the
          creator understand the script without taking creative authority
          away from the writer.
        </p>
      </div>

      <button
        type="button"
        disabled={processing}
        onClick={() => void onAnalyse()}
        className="w-full rounded-2xl border border-yellow-600/40 bg-yellow-500/10 p-4 text-left transition hover:border-yellow-500 hover:bg-yellow-500/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <p className="font-semibold text-yellow-400">
          Analyse Screenplay
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-400">
          Run comprehensive screenplay intelligence.
        </p>
      </button>

      {!analysis ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-6">
          <p className="font-medium">
            No analysis yet
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Analyse the screenplay to generate story, character, scene,
            dialogue, spiritual, cultural, professional, and production
            intelligence.
          </p>
        </div>
      ) : (
        <div className="space-y-8">

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Screenplay Overview
              </h3>

              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                {analysis.screenplay?.format || "Screenplay"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Pages"
                value={analysis.screenplay?.pages ?? 0}
              />

              <Metric
                label="Acts"
                value={analysis.screenplay?.acts ?? 0}
              />

              <Metric
                label="Scenes"
                value={analysis.screenplay?.scenes ?? 0}
              />

              <Metric
                label="Format"
                value={analysis.screenplay?.format || "—"}
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Story Intelligence
            </h3>

            <div className="space-y-4">
              <Info
                label="Genre"
                value={analysis.story?.genre}
              />

              <Info
                label="Theme"
                value={analysis.story?.theme}
              />

              <Info
                label="Logline"
                value={analysis.story?.logline}
              />

              <Info
                label="Synopsis"
                value={analysis.story?.synopsis}
              />
            </div>

            <ListSection
              title="Strengths"
              items={analysis.story?.strengths}
            />

            <ListSection
              title="Weaknesses"
              items={analysis.story?.weaknesses}
            />

            <ListSection
              title="Recommendations"
              items={analysis.story?.recommendations}
            />
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Character Intelligence
            </h3>

            {analysis.characters?.length ? (
              <div className="space-y-3">
                {analysis.characters.map((character, index) => (
                  <div
                    key={`${character.name}-${index}`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {character.name || "Unnamed Character"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {character.role || "Role not identified"}
                        </p>
                      </div>

                      <Score value={character.consistency} />
                    </div>

                    <Info
                      label="Arc"
                      value={character.arc}
                    />

                    <ListSection
                      title="Notes"
                      items={character.notes}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No meaningful characters were identified." />
            )}
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Scene Intelligence
            </h3>

            {analysis.scenes?.length ? (
              <div className="space-y-3">
                {analysis.scenes.map((scene, index) => (
                  <div
                    key={`${scene.number}-${index}`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                        {scene.number}
                      </span>

                      <div className="min-w-0">
                        <p className="font-semibold">
                          {scene.heading || "Scene"}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {scene.purpose || "Purpose not identified."}
                        </p>
                      </div>
                    </div>

                    <ListSection
                      title="Notes"
                      items={scene.notes}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No identifiable scenes were returned." />
            )}
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Dialogue
            </h3>

            <ScoreCard
              label="Dialogue Score"
              value={analysis.dialogue?.score ?? 0}
            />

            <ListSection
              title="Strengths"
              items={analysis.dialogue?.strengths}
            />

            <ListSection
              title="Improvements"
              items={analysis.dialogue?.improvements}
            />
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Spiritual Intelligence
            </h3>

            <ScoreCard
              label="Biblical Alignment"
              value={analysis.spirituality?.biblicalAlignment ?? 0}
            />

            <Info
              label="Kingdom Message"
              value={analysis.spirituality?.kingdomMessage}
            />

            <ListSection
              title="Scripture References"
              items={analysis.spirituality?.scriptureReferences}
            />

            <ListSection
              title="Recommendations"
              items={analysis.spirituality?.recommendations}
            />
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Cultural Intelligence
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Country"
                value={analysis.culture?.country || "—"}
              />

              <Metric
                label="Language"
                value={analysis.culture?.language || "—"}
              />
            </div>

            <Info
              label="Culture"
              value={analysis.culture?.culture}
            />

            <ScoreCard
              label="Authenticity"
              value={analysis.culture?.authenticity ?? 0}
            />

            <ListSection
              title="Recommendations"
              items={analysis.culture?.recommendations}
            />
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Professional Quality
            </h3>

            <ScoreCard
              label="Professional Score"
              value={analysis.professional?.score ?? 0}
            />

            <ListSection
              title="Screenplay Format"
              items={analysis.professional?.screenplayFormat}
            />

            <ListSection
              title="Industry Terminology"
              items={analysis.professional?.industryJargon}
            />

            <ListSection
              title="Continuity"
              items={analysis.professional?.continuity}
            />

            <ListSection
              title="Clarity"
              items={analysis.professional?.clarity}
            />

            <ListSection
              title="Recommendations"
              items={analysis.professional?.recommendations}
            />
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-6">
            <h3 className="font-semibold">
              Production Intelligence
            </h3>

            <Info
              label="Budget Level"
              value={analysis.production?.budget}
            />

            <Info
              label="Complexity"
              value={analysis.production?.complexity}
            />

            <ListSection
              title="Production Risks"
              items={analysis.production?.risks}
            />

            <ListSection
              title="Recommendations"
              items={analysis.production?.recommendations}
            />
          </section>

        </div>
      )}
    </aside>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

function Score({
  value,
}: {
  value: number;
}) {
  return (
    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
      {value}%
    </span>
  );
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">
          {label}
        </span>

        <span className="text-xl font-bold text-yellow-400">
          {value}%
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-yellow-500"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-sm leading-6 text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function ListSection({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items?.length) {
    return null;
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {title}
      </p>

      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="rounded-xl bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">
      {text}
    </div>
  );
}
