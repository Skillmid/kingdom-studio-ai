import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-zinc-950">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.12),transparent_60%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center px-6 py-24">
        <div className="max-w-3xl">

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-yellow-500">
            Skillmid Creatives
          </p>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl">
            Turn Stories
            <br />
            Into Cinema.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400">
            Kingdom Studio AI is an AI-powered filmmaking platform that
            helps creators plan, direct, generate, and produce cinematic
            stories—from the first idea to the final film.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-yellow-500 px-8 py-4 font-semibold text-black transition hover:bg-yellow-400"
            >
              Start Creating
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-zinc-700 px-8 py-4 font-semibold text-white transition hover:border-zinc-500"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-8 border-t border-zinc-800 pt-8">

            <div>
              <h3 className="text-3xl font-bold text-white">AI</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Creative Director
              </p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-white">∞</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Creative Possibilities
              </p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-white">24/7</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Production Assistant
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}