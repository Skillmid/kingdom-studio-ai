"use client";

import type { ReactNode } from "react";

import { ProductionProvider } from "../context/ProductionContext";
import { useProduction } from "../hooks/use-production";
import type { Production } from "../types/production";

import ProductionLayout from "./ProductionLayout";
import ProductionHeader from "./ProductionHeader";

interface ProductionWorkspaceProps {
  id: string;
  initialProduction: Production;
  children: ReactNode;
}

export default function ProductionWorkspace({
  id,
  initialProduction,
  children,
}: ProductionWorkspaceProps) {
  const {
    production,
    loading,
    error,
    updateProduction,
  } = useProduction(id, initialProduction);

  if (loading) {
    return (
      <ProductionLayout>
        <ProductionHeader
          productionId={id}
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
          productionId={id}
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
        productionId={id}
        productionTitle={production.title}
        productionStatus={production.status}
      />

      <div className="flex-1">
        {/* Share the production already loaded here so pages under this layout do not
            fetch the same row again in a second, sequential request. */}
        <ProductionProvider
          production={production}
          loading={loading}
          updateProduction={updateProduction}
        >
          {children}
        </ProductionProvider>
      </div>
    </ProductionLayout>
  );
}
