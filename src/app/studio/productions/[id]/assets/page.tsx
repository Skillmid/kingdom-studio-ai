interface AssetsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetsPage({
  params,
}: AssetsPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Assets</h1>

      <p className="mt-4 text-zinc-400">
        Manage production assets including props, graphics, documents,
        reference images, audio, and other production resources.
      </p>
    </div>
  );
}