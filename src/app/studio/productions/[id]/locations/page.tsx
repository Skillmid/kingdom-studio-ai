interface LocationsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LocationsPage({
  params,
}: LocationsPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Locations
      </h1>

      <p className="mt-4 text-zinc-400">
        Create and manage every filming location, set, environment,
        and reference used throughout your production.
      </p>
    </div>
  );
}