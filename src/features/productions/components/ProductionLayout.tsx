import type { ReactNode } from "react";

import ProductionHeader from "./ProductionHeader";
import ProductionSidebar from "./ProductionSidebar";

interface ProductionLayoutProps {
  children: ReactNode;
}

export default function ProductionLayout({
  children,
}: ProductionLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      <ProductionHeader />

      <div className="flex">

        <ProductionSidebar />

        <main className="flex-1 p-10">
          {children}
        </main>

      </div>

    </div>
  );
}