import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getServerAccess } from "@/lib/auth/server-access";

export default async function StudioRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await getServerAccess();

  if (!user) redirect("/login");

  return children;
}
