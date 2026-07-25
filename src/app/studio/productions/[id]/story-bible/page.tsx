interface StoryBiblePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StoryBiblePage({
  params,
}: StoryBiblePageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Story Bible</h1>

      <p className="mt-4 text-zinc-400">
        Build the vision, narrative, audience, themes, and biblical
        foundation for this production.
      </p>
    </div>
  );
}