import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { getOwnedProduction } from "@/lib/auth/owned-production";
import { getServerAccess } from "@/lib/auth/server-access";
import type { Production } from "@/features/productions/types/production";
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
  const { supabase, user } = await getServerAccess();

  if (!user) redirect("/login");

  const production = await getOwnedProduction(
    id,
    user.id,
    async (productionId) => {
      const { data, error } = await supabase
        .from("productions")
        .select("*")
        .eq("id", productionId)
        .maybeSingle();

      if (error) throw error;
      return (data as Production | null) ?? null;
    },
  );

  if (!production) notFound();

  return (
    <ProductionWorkspace
      key={id}
      id={id}
      initialProduction={production}
    >
      {children}
    </ProductionWorkspace>
  );
}
