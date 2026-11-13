import StudioLayout from "@/features/studio/components/StudioLayout";
import GlobalAssetsWorkspace from "@/features/assets/components/GlobalAssetsWorkspace";

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
          Open a production to manage its reference assets and generation jobs.
        </p>

      </section>

      <GlobalAssetsWorkspace />

    </StudioLayout>
  );
}
