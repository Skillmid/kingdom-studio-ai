import { DirectorNotesView } from "@/features/ai-director/components/DirectorNotesView";

interface AIDirectorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AIDirectorPage({ params }: AIDirectorPageProps) {
  const { id } = await params;

  return <DirectorNotesView key={id} productionId={id} />;
}
