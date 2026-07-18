"use client";

interface StoryBibleKingdomVisionProps {
  theme: string;
  coreMessage: string;
  scriptureFoundation: string;
  kingdomObjective: string;

  onThemeChange: (value: string) => void;
  onCoreMessageChange: (value: string) => void;
  onScriptureFoundationChange: (
    value: string
  ) => void;
  onKingdomObjectiveChange: (
    value: string
  ) => void;
}

export default function StoryBibleKingdomVision({
  theme,
  coreMessage,
  scriptureFoundation,
  kingdomObjective,
  onThemeChange,
  onCoreMessageChange,
  onScriptureFoundationChange,
  onKingdomObjectiveChange,
}: StoryBibleKingdomVisionProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div className="mb-8">

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Section 2
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Kingdom Vision
        </h2>

        <p className="mt-3 max-w-3xl text-zinc-400">
          Define the spiritual direction and message behind your
          production. This information will guide AI-generated
          stories, dialogue and visual content.
        </p>

      </div>

      <div className="space-y-6">

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Theme
          </label>

          <textarea
            rows={3}
            value={theme}
            onChange={(e) =>
              onThemeChange(
                e.target.value
              )
            }
            placeholder="Faith, redemption, forgiveness..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Core Message
          </label>

          <textarea
            rows={4}
            value={coreMessage}
            onChange={(e) =>
              onCoreMessageChange(
                e.target.value
              )
            }
            placeholder="What should viewers remember after watching?"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Scripture Foundation
          </label>

          <textarea
            rows={3}
            value={scriptureFoundation}
            onChange={(e) =>
              onScriptureFoundationChange(
                e.target.value
              )
            }
            placeholder="Matthew 7:24–27..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Kingdom Objective
          </label>

          <textarea
            rows={4}
            value={kingdomObjective}
            onChange={(e) =>
              onKingdomObjectiveChange(
                e.target.value
              )
            }
            placeholder="Describe the Kingdom impact this production should have."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

      </div>

    </section>
  );
}