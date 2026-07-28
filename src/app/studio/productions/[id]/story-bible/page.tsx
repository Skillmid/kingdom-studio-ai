import StoryBibleWorkspace from "@/features/story-bible/components/StoryBibleWorkspace";

interface StoryBiblePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StoryBiblePage({
  params,
}: StoryBiblePageProps) {
  const { id } = await params;

  return (
    <StoryBibleWorkspace
      productionId={id}
    />
  );
}