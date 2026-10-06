import Link from "next/link";

interface WorldBuildingPageProps {
  params: Promise<{
    id: string;
  }>;
}

const worldPillars = [
  {
    title: "Location Bible & Sets",
    description:
      "Design physical environments, architecture, weather conditions, lighting mood, and interior/exterior continuity.",
    href: (id: string) => `/studio/productions/${id}/locations`,
    badge: "PHYSICAL WORLD",
    actionLabel: "Manage Environments",
  },
  {
    title: "Story Bible & Lore",
    description:
      "Establish the thematic vision, narrative rules, cultural background, story stakes, and production direction.",
    href: (id: string) => `/studio/productions/${id}/story-bible`,
    badge: "THEMATIC CORE",
    actionLabel: "Open Story Bible",
  },
  {
    title: "Characters & Communities",
    description:
      "Define the people, families, factions, relationships, and communities that inhabit the world and carry the narrative.",
    href: (id: string) => `/studio/productions/${id}/characters`,
    badge: "INHABITANTS",
    actionLabel: "View Character Bible",
  },
  {
    title: "Screenplay Rules & Continuity",
    description:
      "Keep scene headings, story beats, environmental descriptions, and production details consistent with the established world.",
    href: (id: string) => `/studio/productions/${id}/screenplay`,
    badge: "SCRIPT CONTEXT",
    actionLabel: "Review Screenplay",
  },
];

const worldPrinciples = [
  {
    title: "Narrative Integrity",
    description:
      "Keep the world's rules, character motivations, themes, and story logic consistent from development through production.",
  },
  {
    title: "Cultural Authenticity",
    description:
      "Represent historical, regional, and cultural contexts with research, accuracy, dignity, and intentional production choices.",
  },
  {
    title: "Visual Continuity",
    description:
      "Maintain consistency across environments, lighting, set dressing, wardrobe, and visual references before production.",
  },
];

export default async function WorldBuildingPage({
  params,
}: WorldBuildingPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <header className="flex flex-col gap-6 border-b border-zinc-800 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">
            Pre-Production • World Building
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
            World Building
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Design and manage the universe of your production. World Building
            connects your physical locations, story bible, characters, and
            screenplay continuity into one coherent reality.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/studio/productions/${id}/locations`}
            className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            Open Location Bible
          </Link>

          <Link
            href={`/studio/productions/${id}/story-bible`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-yellow-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            Open Story Bible
          </Link>
        </div>
      </header>

      <section aria-labelledby="world-building-pillars">
        <div className="mb-6">
          <h2
            id="world-building-pillars"
            className="text-xl font-bold text-white"
          >
            World Building Pillars
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
            Build a coherent production world by connecting its environments,
            narrative foundation, inhabitants, and screenplay context.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {worldPillars.map((pillar) => (
            <article
              key={pillar.title}
              className="group flex min-h-[250px] flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/60 p-7 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div>
                <span className="inline-flex rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                  {pillar.badge}
                </span>

                <h3 className="mt-4 text-xl font-bold text-white">
                  {pillar.title}
                </h3>

                <p className="mt-2.5 max-w-xl text-sm leading-6 text-zinc-400">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-7 border-t border-zinc-800/80 pt-4">
                <Link
                  href={pillar.href(id)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-yellow-500 transition hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  <span>{pillar.actionLabel}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="world-building-principles"
        className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 md:p-8"
      >
        <div className="max-w-3xl">
          <h2
            id="world-building-principles"
            className="text-lg font-bold text-white"
          >
            World Building Principles
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Use these principles to keep creative decisions consistent,
            intentional, and production-ready throughout the filmmaking
            process.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {worldPrinciples.map((principle) => (
            <div
              key={principle.title}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5"
            >
              <h3 className="text-sm font-bold text-yellow-500">
                {principle.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}