"use client";

interface StoryBibleOverviewProps {
  title: string;
  logline: string;
  synopsis: string;

  onTitleChange: (value: string) => void;
  onLoglineChange: (value: string) => void;
  onSynopsisChange: (value: string) => void;
}

export default function StoryBibleOverview({
  title,
  logline,
  synopsis,
  onTitleChange,
  onLoglineChange,
  onSynopsisChange,
}: StoryBibleOverviewProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div className="mb-8">

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Section 1
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Overview
        </h2>

        <p className="mt-3 max-w-3xl text-zinc-400">
          Capture the essence of your production.
          Everything begins here.
        </p>

      </div>

      <div className="space-y-6">

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Production Title
          </label>

          <input
            value={title}
            onChange={(e) =>
              onTitleChange(
                e.target.value
              )
            }
            placeholder="The Building and the Builders"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-4 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Logline
          </label>

          <textarea
            rows={3}
            value={logline}
            onChange={(e) =>
              onLoglineChange(
                e.target.value
              )
            }
            placeholder="A one-sentence description of your story."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Synopsis
          </label>

          <textarea
            rows={10}
            value={synopsis}
            onChange={(e) =>
              onSynopsisChange(
                e.target.value
              )
            }
            placeholder="Describe your story in detail..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

      </div>

    </section>
  );
}