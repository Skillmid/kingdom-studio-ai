interface StoryboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StoryboardPage({
  params,
}: StoryboardPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Storyboard
      </h1>

      <p className="mt-4 text-zinc-400">
        Visualize your production with storyboard panels, shot sequences,
        camera composition, and scene planning before rendering.
      </p>
    </div>
  );
}