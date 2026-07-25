interface ShotListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ShotListPage({
  params,
}: ShotListPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Shot List
      </h1>

      <p className="mt-4 text-zinc-400">
        Create and organize every camera shot, including shot type,
        framing, movement, lens, equipment, and production notes.
      </p>
    </div>
  );
}