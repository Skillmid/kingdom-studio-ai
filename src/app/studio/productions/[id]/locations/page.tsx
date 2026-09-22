import { LocationsView } from "@/features/locations/components/LocationsView";

interface LocationsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LocationsPage({ params }: LocationsPageProps) {
  const { id } = await params;

  return <LocationsView productionId={id} />;
}
