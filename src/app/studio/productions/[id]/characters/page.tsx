import { CharactersView } from "@/features/characters/components/CharactersView";

interface CharactersPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CharactersPage({
  params,
}: CharactersPageProps) {
  const { id } = await params;

  return <CharactersView productionId={id} />;
}