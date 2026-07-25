interface CharactersPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CharactersPage({
  params,
}: CharactersPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Characters</h1>

      <p className="mt-4 text-zinc-400">
        Create and manage the characters that appear in this production.
      </p>
    </div>
  );
}