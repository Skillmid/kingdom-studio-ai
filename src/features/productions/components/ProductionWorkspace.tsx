"use client";

import ProductionLayout from "./ProductionLayout";
import ProductionOverview from "./ProductionOverview";

import { useProduction } from "../hooks/use-production";

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
        <div className="p-10 text-xl">
          Loading production...
        </div>
      </ProductionLayout>
    );
  }

  if (error) {
    return (
      <ProductionLayout>
        <div className="p-10 text-red-500">
          {error}
        </div>
      </ProductionLayout>
    );
  }

  if (!production) {
    return (
      <ProductionLayout>
        <div className="p-10">
          Production not found.
        </div>
      </ProductionLayout>
    );
  }

  return (
    <ProductionLayout>
      <ProductionOverview
        production={production}
      />
    </ProductionLayout>
  );
}