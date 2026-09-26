import { ShotListView } from "@/features/shots/components/ShotListView";

interface ShotListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ShotListPage({ params }: ShotListPageProps) {
  const { id } = await params;

  return <ShotListView productionId={id} />;
}
