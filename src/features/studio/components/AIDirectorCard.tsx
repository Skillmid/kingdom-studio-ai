export default function AIDirectorCard() {
  return (
    <section className="mt-10 rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-zinc-900 to-zinc-950 p-10">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm uppercase tracking-[0.25em] text-yellow-500">
            AI DIRECTOR
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            What story are we telling today?
          </h2>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            I'm here to help you develop stories, create memorable
            characters, plan cinematic scenes, generate production assets,
            and guide every step of your filmmaking journey.
          </p>

        </div>

      </div>

      <div className="mt-8 flex flex-wrap gap-4">

        <button className="rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400">
          Start with AI Director
        </button>

        <button className="rounded-xl border border-zinc-700 px-6 py-3 transition hover:border-yellow-500">
          Learn More
        </button>

      </div>

    </section>
  );
}