import StudioLayout from "@/features/studio/components/StudioLayout";

const assetCategories = [
  {
    title: "Images",
    description:
      "Production stills, concept art and reference images.",
  },
  {
    title: "Videos",
    description:
      "Video clips and cinematic footage.",
  },
  {
    title: "Audio",
    description:
      "Music, ambience, sound effects and recordings.",
  },
  {
    title: "Voice",
    description:
      "Voice overs and generated narration.",
  },
  {
    title: "Documents",
    description:
      "Scripts, story bibles and production documents.",
  },
  {
    title: "Brand Assets",
    description:
      "Logos, fonts and reusable Kingdom Studio resources.",
  },
];

export default function AssetsPage() {
  return (
    <StudioLayout>

      <section>

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          Global Assets
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
          Manage reusable assets that can be shared across all
          your productions.
        </p>

      </section>

      <section className="mt-10">

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {assetCategories.map((category) => (

            <button
              key={category.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-left transition duration-300 hover:border-yellow-500 hover:bg-zinc-800"
            >

              <h2 className="text-2xl font-semibold">
                {category.title}
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                {category.description}
              </p>

            </button>

          ))}

        </div>

      </section>

    </StudioLayout>
  );
}