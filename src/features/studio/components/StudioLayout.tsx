import type { ReactNode } from "react";

import StudioHeader from "./StudioHeader";
import StudioSidebar from "./StudioSidebar";

interface StudioLayoutProps {
  children: ReactNode;
}

export default function StudioLayout({
  children,
}: StudioLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      <div className="flex min-h-screen">

        <StudioSidebar />

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">

          <StudioHeader />

          <main className="flex-1 overflow-y-auto">

            <div className="mx-auto w-full max-w-7xl p-8">

              {children}

            </div>

          </main>

        </div>

      </div>

    </div>
  );
}