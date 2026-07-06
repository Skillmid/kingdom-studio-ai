"use client";

import { useProduction } from "../hooks/use-production";

import ProductionLayout from "./ProductionLayout";
import ProductionHeader from "./ProductionHeader";
import ProductionOverview from "./ProductionOverview";

interface ProductionWorkspaceProps {
  id: string;
}

export default function ProductionWorkspace({
  id,
}: ProductionWorkspaceProps) {
  const {
    production,
    loading,
    error,
  } = useProduction(id);

  if (loading) {
    return (
      <ProductionLayout>
        <ProductionHeader
          productionTitle="Loading..."
          productionStatus="Loading"
        />

        <div className="p-10">
          Loading production...
        </div>
      </ProductionLayout>
    );
  }

  if (error || !production) {
    return (
      <ProductionLayout>
        <ProductionHeader
          productionTitle="Unknown Production"
          productionStatus="Error"
        />

        <div className="m-10 rounded-3xl border border-red-900 bg-red-950/20 p-8">
          <h2 className="text-2xl font-bold text-red-400">
            Unable to load production
          </h2>

          <p className="mt-4 text-zinc-400">
            {error ??
              "The requested production could not be found."}
          </p>
        </div>
      </ProductionLayout>
    );
  }

  return (
    <ProductionLayout>
      <ProductionHeader
        productionTitle={production.title}
        productionStatus={production.status}
      />

      <div className="p-10">
        <ProductionOverview
          production={production}
        />
      </div>
    </ProductionLayout>
  );
}