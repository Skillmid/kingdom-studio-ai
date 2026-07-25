interface ScreenplayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ScreenplayPage({
  params,
}: ScreenplayPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Screenplay
      </h1>

      <p className="mt-4 text-zinc-400">
        Develop, organize, and edit the complete screenplay for your
        production, including dialogue, action, transitions, and scene
        structure.
      </p>
    </div>
  );
}