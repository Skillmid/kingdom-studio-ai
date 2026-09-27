import { RenderView } from "@/features/render/components/RenderView";

interface ExportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExportPage({ params }: ExportPageProps) {
  const { id } = await params;
  return <RenderView productionId={id} mode="export" />;
}
