import AIDirectorWorkspace from "@/features/ai-director/components/AIDirectorWorkspace";

interface AIDirectorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AIDirectorPage({
  params,
}: AIDirectorPageProps) {
  await params;

  return <AIDirectorWorkspace />;
}