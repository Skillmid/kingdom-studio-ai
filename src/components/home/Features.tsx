import {
  Clapperboard,
  Film,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Director",
    description:
      "Receive intelligent creative guidance from concept to final production.",
  },
  {
    icon: Film,
    title: "Story Workspace",
    description:
      "Develop scripts, scenes, and story structure inside one organized workspace.",
  },
  {
    icon: Clapperboard,
    title: "Production Studio",
    description:
      "Generate cinematic scenes, manage assets, and build complete productions.",
  },
  {
    icon: Users,
    title: "Creative Collaboration",
    description:
      "Designed for creators today and collaborative production teams tomorrow.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="border-t border-zinc-800 bg-zinc-950 py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="max-w-3xl">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-500">
            Platform Features
          </p>

          <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Everything You Need To Build
            Cinematic Stories
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Kingdom Studio AI combines creative planning,
            intelligent assistance and production tools into
            one professional filmmaking platform.
          </p>

        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 transition hover:border-yellow-500"
            >
              <feature.icon
                size={36}
                className="text-yellow-500"
              />

              <h3 className="mt-6 text-2xl font-semibold text-white">
                {feature.title}
              </h3>

              <p className="mt-4 leading-7 text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}