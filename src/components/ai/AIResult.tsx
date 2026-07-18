"use client";

interface AIResultProps {
  title?: string;

  content: string;

  onAccept?: () => void;

  onDiscard?: () => void;
}

export default function AIResult({
  title = "AI Suggestion",
  content,
  onAccept,
  onDiscard,
}: AIResultProps) {
  return (
    <section className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 p-6">

      <h3 className="text-xl font-semibold text-yellow-400">
        {title}
      </h3>

      <div className="mt-4 whitespace-pre-wrap leading-8 text-zinc-300">
        {content}
      </div>

      {(onAccept || onDiscard) && (

        <div className="mt-6 flex gap-3">

          {onAccept && (

            <button
              type="button"
              onClick={onAccept}
              className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Accept
            </button>

          )}

          {onDiscard && (

            <button
              type="button"
              onClick={onDiscard}
              className="rounded-xl border border-zinc-700 px-5 py-3 transition hover:border-red-500"
            >
              Discard
            </button>

          )}

        </div>

      )}

    </section>
  );
}