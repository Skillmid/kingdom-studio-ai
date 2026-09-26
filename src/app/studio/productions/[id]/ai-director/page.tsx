import { AIDirectorView } from "@/features/ai-director/components/AIDirectorView";

interface AIDirectorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AIDirectorPage({
  params,
}: AIDirectorPageProps) {
  const { id } = await params;

  return <AIDirectorView productionId={id} />;
}
