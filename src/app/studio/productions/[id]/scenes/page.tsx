import { ScenesView } from "@/features/scenes/components/ScenesView";

interface ScenesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ScenesPage({ params }: ScenesPageProps) {
  const { id } = await params;

  return <ScenesView productionId={id} />;
}
