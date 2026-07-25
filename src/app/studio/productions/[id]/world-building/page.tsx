interface WorldBuildingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorldBuildingPage({
  params,
}: WorldBuildingPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        World Building
      </h1>

      <p className="mt-4 text-zinc-400">
        Design and manage the universe of your production, including its
        history, cultures, rules, environments, organizations, and
        supporting lore.
      </p>
    </div>
  );
}