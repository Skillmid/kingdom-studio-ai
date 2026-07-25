interface ScenesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ScenesPage({
  params,
}: ScenesPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Scenes
      </h1>

      <p className="mt-4 text-zinc-400">
        Plan, organize, and manage every scene in your production,
        including story flow, locations, characters, and production
        requirements.
      </p>
    </div>
  );
}