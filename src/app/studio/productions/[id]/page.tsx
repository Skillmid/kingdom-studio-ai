"use client";

import { use } from "react";

import ProductionOverview from "@/features/productions/components/ProductionOverview";
import ProductionWorkspace from "@/features/productions/components/ProductionWorkspace";
import { useProduction } from "@/features/productions/hooks/use-production";

interface ProductionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductionPage({
  params,
}: ProductionPageProps) {
  const { id } = use(params);

  const {
    production,
    loading,
    error,
  } = useProduction(id);

  if (loading) {
    return (
      <ProductionWorkspace id={id}>
        <div className="p-10">
          Loading production...
        </div>
      </ProductionWorkspace>
    );
  }

  if (error || !production) {
    return (
      <ProductionWorkspace id={id}>
        <div className="m-10 rounded-3xl border border-red-900 bg-red-950/20 p-8">
          <h2 className="text-2xl font-bold text-red-400">
            Unable to load production
          </h2>

          <p className="mt-4 text-zinc-400">
            {error ??
              "The requested production could not be found."}
          </p>
        </div>
      </ProductionWorkspace>
    );
  }

  return (
    <ProductionWorkspace id={id}>
      <div className="p-10">
        <ProductionOverview
          production={production}
        />
      </div>
    </ProductionWorkspace>
  );
}