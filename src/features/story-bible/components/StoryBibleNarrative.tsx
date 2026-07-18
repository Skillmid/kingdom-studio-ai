"use client";

interface StoryBibleNarrativeProps {
  beginning: string;
  conflict: string;
  midpoint: string;
  climax: string;
  ending: string;

  onBeginningChange: (
    value: string
  ) => void;

  onConflictChange: (
    value: string
  ) => void;

  onMidpointChange: (
    value: string
  ) => void;

  onClimaxChange: (
    value: string
  ) => void;

  onEndingChange: (
    value: string
  ) => void;
}

export default function StoryBibleNarrative({
  beginning,
  conflict,
  midpoint,
  climax,
  ending,
  onBeginningChange,
  onConflictChange,
  onMidpointChange,
  onClimaxChange,
  onEndingChange,
}: StoryBibleNarrativeProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div className="mb-8">

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Section 3
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Narrative Structure
        </h2>

        <p className="mt-3 max-w-3xl text-zinc-400">
          Define the major story beats that guide the screenplay,
          scene planner and AI Director.
        </p>

      </div>

      <div className="space-y-8">

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Beginning
          </label>

          <textarea
            rows={5}
            value={beginning}
            onChange={(e) =>
              onBeginningChange(
                e.target.value
              )
            }
            placeholder="Describe how the story begins..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Central Conflict
          </label>

          <textarea
            rows={5}
            value={conflict}
            onChange={(e) =>
              onConflictChange(
                e.target.value
              )
            }
            placeholder="What major conflict drives the story?"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Midpoint
          </label>

          <textarea
            rows={5}
            value={midpoint}
            onChange={(e) =>
              onMidpointChange(
                e.target.value
              )
            }
            placeholder="Describe the turning point of the story..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Climax
          </label>

          <textarea
            rows={5}
            value={climax}
            onChange={(e) =>
              onClimaxChange(
                e.target.value
              )
            }
            placeholder="Describe the climax..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Ending
          </label>

          <textarea
            rows={5}
            value={ending}
            onChange={(e) =>
              onEndingChange(
                e.target.value
              )
            }
            placeholder="Describe how the story ends..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

      </div>

    </section>
  );
}