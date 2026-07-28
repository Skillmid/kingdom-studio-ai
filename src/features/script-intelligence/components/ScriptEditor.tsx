"use client";

interface ScriptEditorProps {
  value: string;

  onChange: (
    value: string
  ) => void;

  disabled?: boolean;
}

export default function ScriptEditor({
  value,
  onChange,
  disabled = false,
}: ScriptEditorProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

      <div className="border-b border-zinc-800 px-6 py-5">

        <h2 className="text-xl font-semibold">
          Screenplay
        </h2>

        <p className="mt-1 text-sm text-zinc-400">
          Import, write, review, and
          professionally refine the full
          screenplay.
        </p>

      </div>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={`INT. LOCATION - DAY

Action...

CHARACTER
Dialogue...`}
        spellCheck
        className="min-h-[700px] w-full resize-y bg-zinc-950 p-8 font-mono text-sm leading-7 text-zinc-200 outline-none disabled:opacity-60"
      />

    </section>
  );
}