import StudioLayout from "@/features/studio/components/StudioLayout";

import ArchivedProductions from "@/features/productions/components/ArchivedProductions";

export default function ArchivedProductionsPage() {
  return (
    <StudioLayout>

      <section>

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          Archived Productions
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
          Restore archived productions or permanently delete
          productions you no longer need.
        </p>

      </section>

      <ArchivedProductions />

    </StudioLayout>
  );
}