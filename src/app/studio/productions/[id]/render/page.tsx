import { RenderView } from "@/features/render/components/RenderView";

interface RenderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RenderPage({ params }: RenderPageProps) {
  const { id } = await params;
  return <RenderView key={`${id}:render`} productionId={id} mode="render" />;
}
