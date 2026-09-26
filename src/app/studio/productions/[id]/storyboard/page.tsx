import { StoryboardView } from "@/features/storyboard/components/StoryboardView";

interface StoryboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StoryboardPage({ params }: StoryboardPageProps) {
  const { id } = await params;

  return <StoryboardView productionId={id} />;
}
