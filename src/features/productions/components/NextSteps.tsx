import Link from "next/link";

interface NextStepsProps {
  productionId: string;
}

const workflowGroups = [
  {
    title: "Develop the story",
    stages: [
      { label: "Screenplay", path: "screenplay", description: "Write, import, and review your script." },
      { label: "Story Bible", path: "story-bible", description: "Keep story intent and creative direction together." },
    ],
  },
  {
    title: "Plan the production",
    stages: [
      { label: "Characters", path: "characters", description: "Review character profiles and screenplay evidence." },
      { label: "Locations", path: "locations", description: "Organize the production's settings and references." },
      { label: "Scenes", path: "scenes", description: "Develop and review the production's scenes." },
      { label: "Shot List", path: "shot-list", description: "Plan visual coverage for each scene." },
      { label: "Storyboard", path: "storyboard", description: "Review the visual sequence shot by shot." },
      { label: "AI Director", path: "ai-director", description: "Review production direction proposals." },
    ],
  },
  {
    title: "Create and deliver",
    stages: [
      { label: "Assets", path: "assets", description: "Review production assets and generation jobs." },
      { label: "Render", path: "render", description: "Assemble approved shots, panels, and available media." },
      { label: "Export", path: "export", description: "Save an EDL or JSON delivery manifest." },
    ],
  },
];

export default function NextSteps({ productionId }: NextStepsProps) {
  const productionPath = `/studio/productions/${productionId}`;

  return (
    <section aria-labelledby="creative-workflow-heading" className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">Your production</p>
      <h2 id="creative-workflow-heading" className="mt-3 text-2xl font-bold sm:text-3xl">
        Creative workflow
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
        Move through each stage as your story is ready. AI can assist; you choose what to accept.
      </p>

      <nav aria-label="Creative workflow stages" className="mt-6 grid gap-4 xl:grid-cols-3">
        {workflowGroups.map((group) => (
          <section key={group.title} aria-labelledby={`workflow-${group.title.toLowerCase().replaceAll(" ", "-")}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <h3 id={`workflow-${group.title.toLowerCase().replaceAll(" ", "-")}`} className="mb-3 font-semibold text-zinc-200">
              {group.title}
            </h3>
            <ul className="space-y-3">
              {group.stages.map((stage) => (
                <li key={stage.path}>
                  <Link
                    href={`${productionPath}/${stage.path}`}
                    className="rounded-sm font-medium text-yellow-300 underline decoration-yellow-500/40 underline-offset-4 hover:text-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  >
                    {stage.label}
                  </Link>
                  <p className="mt-1 text-sm leading-5 text-zinc-400">{stage.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </section>
  );
}
