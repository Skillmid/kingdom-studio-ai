import StudioLayout from "@/features/studio/components/StudioLayout";

const templates = [
  {
    title: "Blank Production",
    description:
      "Start completely from scratch.",
  },
  {
    title: "Short Film",
    description:
      "A Kingdom short film structure.",
  },
  {
    title: "Feature Film",
    description:
      "Full cinematic production.",
  },
  {
    title: "Bible Story",
    description:
      "Adapt Scripture into film.",
  },
  {
    title: "Sermon Illustration",
    description:
      "Visual stories for preaching.",
  },
  {
    title: "Children's Animation",
    description:
      "Bible stories for children.",
  },
  {
    title: "Christmas Production",
    description:
      "Nativity and Christmas productions.",
  },
  {
    title: "Easter Production",
    description:
      "Death and Resurrection productions.",
  },
  {
    title: "Gospel Campaign",
    description:
      "Evangelism and outreach productions.",
  },
];

export default function TemplatesPage() {
  return (
    <StudioLayout>

      <section>

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          Templates
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
          Start faster with professionally designed
          Kingdom production templates.
        </p>

      </section>

      <section className="mt-10">

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {templates.map((template) => (

            <button
              key={template.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-left transition duration-300 hover:border-yellow-500 hover:bg-zinc-800"
            >

              <h2 className="text-2xl font-semibold">
                {template.title}
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                {template.description}
              </p>

            </button>

          ))}

        </div>

      </section>

    </StudioLayout>
  );
}