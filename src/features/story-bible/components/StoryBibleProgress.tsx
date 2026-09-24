"use client";

interface StoryBibleProgressProps {
  title: string;
  logline: string;
  synopsis: string;

  burden: string;
  truth: string;
  humanProblem: string;

  theme: string;
  coreMessage: string;
  scripture: string;
  kingdomObjective: string;

  genre: string;

  beginning: string;
  conflict: string;
  midpoint: string;
  climax: string;
  ending: string;

  aiContext: string;
  aiRules: string;
  forbiddenElements: string;
  preferredVocabulary: string;
  visualConsistency: string;
}

type SectionStatus = "complete" | "partial" | "needs-input";

function getStatus(values: string[]): SectionStatus {
  const filled = values.filter(Boolean).length;

  if (filled === values.length) return "complete";
  if (filled > 0) return "partial";
  return "needs-input";
}

const statusLabel: Record<SectionStatus, string> = {
  complete: "Complete",
  partial: "Partially Complete",
  "needs-input": "Needs Creator Input",
};

const statusClass: Record<SectionStatus, string> = {
  complete: "font-semibold text-green-400",
  partial: "font-semibold text-yellow-400",
  "needs-input": "text-zinc-500",
};

export default function StoryBibleProgress({
  title,
  logline,
  synopsis,
  burden,
  truth,
  humanProblem,
  theme,
  coreMessage,
  scripture,
  kingdomObjective,
  genre,
  beginning,
  conflict,
  midpoint,
  climax,
  ending,
  aiContext,
  aiRules,
  forbiddenElements,
  preferredVocabulary,
  visualConsistency,
}: StoryBibleProgressProps) {
  const sections = [
    {
      label: "Overview",
      status: getStatus([title, logline, synopsis]),
    },
    {
      label: "Creator Foundation",
      status: getStatus([burden, truth, humanProblem]),
    },
    {
      label: "Kingdom Vision",
      status: getStatus([theme, coreMessage, scripture, kingdomObjective]),
    },
    {
      label: "Narrative",
      status: getStatus([beginning, conflict, midpoint, climax, ending]),
    },
    {
      label: "Production Details",
      status: getStatus([genre]),
    },
    {
      label: "AI Context",
      status: getStatus([
        aiContext,
        aiRules,
        forbiddenElements,
        preferredVocabulary,
        visualConsistency,
      ]),
    },
  ];

  const completed = sections.filter((section) => section.status === "complete").length;
  const percentage = Math.round((completed / sections.length) * 100);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
            Story Bible Progress
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {percentage}% Complete
          </h2>
        </div>

        <div className="text-right">
          <p className="text-5xl font-bold text-yellow-500">
            {percentage}%
          </p>
        </div>
      </div>

      <div className="mt-8 h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-yellow-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-8 space-y-3">
        {sections.map((section) => (
          <div
            key={section.label}
            className="flex items-center justify-between rounded-xl border border-zinc-800 px-5 py-3"
          >
            <span>{section.label}</span>
            <span className={statusClass[section.status]}>
              {statusLabel[section.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
