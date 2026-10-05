"use client";

import Link from "next/link";
import { useLatestProduction } from "@/features/productions/hooks/use-latest-production";

interface CollaborationArea {
  title: string;
  description: string;
  target: (productionId: string) => string;
  badge: string;
}

const collaborationAreas: CollaborationArea[] = [
  {
    title: "Direction Notes & Blocking",
    description: "Generate grounded scene notes, camera placement, lighting, and pacing proposals.",
    target: (id) => `/studio/productions/${id}/ai-director`,
    badge: "AI Director",
  },
  {
    title: "Script Intelligence & Analysis",
    description: "Review screenplay structure, story beats, dialogue rhythm, and spiritual/cultural themes.",
    target: (id) => `/studio/productions/${id}/screenplay`,
    badge: "Screenplay",
  },
  {
    title: "Character Development",
    description: "Build character profiles, dialogue voices, and cast appearances extracted from the script.",
    target: (id) => `/studio/productions/${id}/characters`,
    badge: "Characters",
  },
  {
    title: "Scene Planning & Beats",
    description: "Organize scenes into production units with emotional intent and performance direction.",
    target: (id) => `/studio/productions/${id}/scenes`,
    badge: "Scene Planner",
  },
  {
    title: "Camera Coverage & Shots",
    description: "Plan cinematic coverage angles, framing, and camera movement derived from scenes.",
    target: (id) => `/studio/productions/${id}/shot-list`,
    badge: "Shot List",
  },
  {
    title: "Visual Storyboard Continuity",
    description: "Review storyboard frames and continuity flow before committing to media generation.",
    target: (id) => `/studio/productions/${id}/storyboard`,
    badge: "Storyboard",
  },
];

export default function AIDirectorWorkspace() {
  const { production, loading } = useLatestProduction();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
          AI Director
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 md:text-lg md:leading-8">
          Your creative collaborator across every stage of production. The AI Director analyzes your scenes,
          proposes camera and performance notes, and helps maintain continuity. You review every proposal,
          modify what you wish, and make the final creative decisions.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {loading ? (
            <div className="h-12 w-48 animate-pulse rounded-xl bg-zinc-800" />
          ) : production ? (
            <Link
              href={`/studio/productions/${production.id}/ai-director`}
              className="rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
            >
              Open AI Director for &ldquo;{production.title}&rdquo;
            </Link>
          ) : (
            <Link
              href="/studio/productions"
              className="rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
            >
              Select or Create a Production
            </Link>
          )}

          <Link
            href="/studio/templates"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-yellow-500 hover:text-white"
          >
            Explore Film Templates
          </Link>
        </div>
      </section>

      {production && (
        <section className="rounded-3xl border border-yellow-500/20 bg-zinc-900/60 p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-500">
                Active Production Context
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {production.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Status: {production.status || "In Development"} · {production.genre || "Drama"}
              </p>
            </div>
            <Link
              href={`/studio/productions/${production.id}`}
              className="inline-flex items-center rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:border-yellow-500 hover:text-white"
            >
              View Production Hub →
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            Creative Collaboration Workflows
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Select an area of production to collaborate with AI Director on your story.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collaborationAreas.map((area) => {
            const destination = production
              ? area.target(production.id)
              : "/studio/productions";

            return (
              <Link
                key={area.title}
                href={destination}
                className="group flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 transition hover:border-yellow-500/60 hover:bg-zinc-850"
              >
                <div>
                  <span className="inline-block rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-400">
                    {area.badge}
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-white group-hover:text-yellow-400 transition">
                    {area.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {area.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-yellow-500 group-hover:translate-x-1 transition-transform">
                  <span>{production ? "Open in production" : "Choose production"}</span>
                  <span>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}