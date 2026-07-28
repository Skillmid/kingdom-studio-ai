import {
  ScriptWorkspace,
} from "@/features/script-intelligence";

interface ScreenplayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ScreenplayPage({
  params,
}: ScreenplayPageProps) {
  const {
    id,
  } = await params;

  return (
    <ScriptWorkspace
      productionId={id}
    />
  );
}