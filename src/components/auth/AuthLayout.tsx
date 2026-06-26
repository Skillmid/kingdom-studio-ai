import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side */}
        <section className="relative hidden overflow-hidden border-r border-zinc-800 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.15),transparent_65%)]" />

          <div className="relative flex w-full flex-col justify-center px-16">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-yellow-500">
              Skillmid Creatives
            </p>

            <h1 className="text-6xl font-extrabold leading-tight">
              Kingdom
              <br />
              Studio AI
            </h1>

            <p className="mt-8 max-w-lg text-xl leading-9 text-zinc-400">
              Build cinematic stories with the power of Artificial Intelligence.
              Plan, direct, generate and produce films from one creative studio.
            </p>

            <div className="mt-16 space-y-6">
              <Feature text="AI Director for creative guidance" />
              <Feature text="Professional story development workspace" />
              <Feature text="Scene planning & production tools" />
              <Feature text="Designed for creators, ministries and filmmakers" />
            </div>

            <div className="mt-20">
              <blockquote className="text-2xl font-semibold italic text-white">
                “Technology should never replace the storyteller.”
              </blockquote>

              <p className="mt-3 text-zinc-500">
                Kingdom Studio AI Philosophy
              </p>
            </div>
          </div>
        </section>

        {/* Right Side */}
        <section className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-500">
              Welcome
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              {title}
            </h2>

            <p className="mt-4 text-zinc-400">
              {subtitle}
            </p>

            <div className="mt-10">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface FeatureProps {
  text: string;
}

function Feature({ text }: FeatureProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />

      <p className="text-zinc-300">
        {text}
      </p>
    </div>
  );
}