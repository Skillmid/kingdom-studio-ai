import type { ReactNode } from "react";

import ProductionSidebar from "./ProductionSidebar";

interface ProductionLayoutProps {
  children: ReactNode;
}

export default function ProductionLayout({
  children,
}: ProductionLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      <div className="flex">

        <ProductionSidebar />

        <main className="min-h-screen flex-1 overflow-y-auto">

          {children}

        </main>

      </div>

    </div>
  );
}