import ProductionWorkspace from "@/features/productions/components/ProductionWorkspace";

interface ProductionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductionPage({
  params,
}: ProductionPageProps) {
  const { id } = await params;

  return (
    <ProductionWorkspace
      id={id}
    />
  );
}