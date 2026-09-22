"use client";

interface StoryBibleCreatorFoundationProps {
  burden: string;
  truth: string;
  humanProblem: string;
  onBurdenChange: (value: string) => void;
  onTruthChange: (value: string) => void;
  onHumanProblemChange: (value: string) => void;
}

const fieldClass = "w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500";

export default function StoryBibleCreatorFoundation({
  burden,
  truth,
  humanProblem,
  onBurdenChange,
  onTruthChange,
  onHumanProblemChange,
}: StoryBibleCreatorFoundationProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Section 2
        </p>
        <h2 className="mt-2 text-3xl font-bold">Creator Foundation</h2>
        <p className="mt-3 max-w-3xl text-zinc-400">
          Start with what the filmmaker is carrying. These answers become the human foundation AI must serve throughout the production.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Burden</label>
          <textarea
            rows={5}
            value={burden}
            onChange={(e) => onBurdenChange(e.target.value)}
            placeholder="What keeps pressing on your heart that you feel must be communicated?"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Truth</label>
          <textarea
            rows={5}
            value={truth}
            onChange={(e) => onTruthChange(e.target.value)}
            placeholder="What truth do you want the audience to encounter through the story?"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Human Problem</label>
          <textarea
            rows={5}
            value={humanProblem}
            onChange={(e) => onHumanProblemChange(e.target.value)}
            placeholder="What real human struggle will carry this truth through a character's life?"
            className={fieldClass}
          />
        </div>
      </div>
    </section>
  );
}
