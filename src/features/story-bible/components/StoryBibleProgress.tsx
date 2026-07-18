"use client";

interface StoryBibleProgressProps {
  title: string;
  logline: string;
  synopsis: string;

  theme: string;
  scripture: string;

  genre: string;

  beginning: string;
  conflict: string;
  climax: string;

  aiContext: string;
}

export default function StoryBibleProgress({
  title,
  logline,
  synopsis,
  theme,
  scripture,
  genre,
  beginning,
  conflict,
  climax,
  aiContext,
}: StoryBibleProgressProps) {
  const sections = [
    {
      label: "Overview",
      complete:
        !!title &&
        !!logline &&
        !!synopsis,
    },
    {
      label: "Kingdom Vision",
      complete:
        !!theme &&
        !!scripture,
    },
    {
      label: "Production Details",
      complete: !!genre,
    },
    {
      label: "Narrative",
      complete:
        !!beginning &&
        !!conflict &&
        !!climax,
    },
    {
      label: "AI Context",
      complete: !!aiContext,
    },
  ];

  const completed =
    sections.filter(
      (section) => section.complete
    ).length;

  const percentage =
    Math.round(
      (completed /
        sections.length) *
        100
    );

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
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <div className="mt-8 space-y-3">

        {sections.map((section) => (

          <div
            key={section.label}
            className="flex items-center justify-between rounded-xl border border-zinc-800 px-5 py-3"
          >

            <span>
              {section.label}
            </span>

            <span
              className={
                section.complete
                  ? "font-semibold text-green-400"
                  : "text-zinc-500"
              }
            >
              {section.complete
                ? "Complete"
                : "Pending"}
            </span>

          </div>

        ))}

      </div>

    </section>
  );
}