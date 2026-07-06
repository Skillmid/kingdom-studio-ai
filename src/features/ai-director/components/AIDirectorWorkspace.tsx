export default function AIDirectorWorkspace() {
  const tools = [
    {
      title: "Generate Story",
      description:
        "Create a Kingdom-centered story from an idea.",
    },
    {
      title: "Generate Characters",
      description:
        "Build memorable characters for your production.",
    },
    {
      title: "Generate Scenes",
      description:
        "Break your story into cinematic scenes.",
    },
    {
      title: "Improve Dialogue",
      description:
        "Rewrite dialogue with better pacing and emotion.",
    },
    {
      title: "Biblical Research",
      description:
        "Research scriptures and biblical themes.",
    },
    {
      title: "Production Coach",
      description:
        "Receive filmmaking guidance from AI Director.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          AI Director
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-400">
          Your creative filmmaking companion.
          Develop stories, build characters,
          create scenes, improve dialogue,
          and receive Kingdom-centered creative guidance.
        </p>

      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

        <h2 className="text-2xl font-semibold">
          Ask AI Director
        </h2>

        <textarea
          rows={6}
          placeholder="Ask AI Director anything about your production..."
          className="mt-6 w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
        />

        <button
          className="mt-6 rounded-2xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400"
        >
          Ask AI Director
        </button>

      </section>

      <section>

        <h2 className="mb-6 text-2xl font-semibold">
          AI Tools
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {tools.map((tool) => (

            <button
              key={tool.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-left transition hover:border-yellow-500 hover:bg-zinc-800"
            >

              <h3 className="text-xl font-semibold">
                {tool.title}
              </h3>

              <p className="mt-4 leading-7 text-zinc-400">
                {tool.description}
              </p>

            </button>

          ))}

        </div>

      </section>

    </div>
  );
}