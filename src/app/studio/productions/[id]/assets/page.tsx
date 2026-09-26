import { AssetsView } from "@/features/assets/components/AssetsView";

interface AssetsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { id } = await params;
  return <AssetsView productionId={id} />;
}
