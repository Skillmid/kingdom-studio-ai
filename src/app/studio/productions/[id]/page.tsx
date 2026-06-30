import ProductionLayout from "@/features/productions/components/ProductionLayout";
import ProductionOverview from "@/features/productions/components/ProductionOverview";

interface ProductionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductionPage({
  params,
}: ProductionPageProps) {
  await params;

  return (
    <ProductionLayout>
      <ProductionOverview />
    </ProductionLayout>
  );
}