import type { ReactNode } from "react";

import ProductionWorkspace from "@/features/productions/components/ProductionWorkspace";

interface ProductionLayoutProps {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function Layout({
  children,
  params,
}: ProductionLayoutProps) {
  const { id } = await params;

  return (
    <ProductionWorkspace
      id={id}
    >
      {children}
    </ProductionWorkspace>
  );
}