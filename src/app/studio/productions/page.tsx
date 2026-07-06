import StudioLayout from "@/features/studio/components/StudioLayout";

import ProductionList from "@/features/productions/components/ProductionList";

export default function ProductionsPage() {
  return (
    <StudioLayout>

      <section>

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          Productions
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
          Manage every production in your Kingdom Studio.
          Create, organize, duplicate, archive and continue
          working on your films.
        </p>

      </section>

      <ProductionList />

    </StudioLayout>
  );
}