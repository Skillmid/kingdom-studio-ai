interface RenderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RenderPage({
  params,
}: RenderPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Render
      </h1>

      <p className="mt-4 text-zinc-400">
        Generate, render, and export the final AI-assisted production
        using your selected rendering pipeline and quality settings.
      </p>
    </div>
  );
}