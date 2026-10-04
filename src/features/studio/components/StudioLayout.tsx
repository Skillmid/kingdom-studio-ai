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

      <div className="flex min-h-screen flex-col lg:flex-row">

        <StudioSidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">

          <StudioHeader />

          <main className="min-w-0 flex-1 overflow-y-auto">

            <div className="mx-auto w-full max-w-7xl p-4 sm:p-8">

              {children}

            </div>

          </main>

        </div>

      </div>

    </div>
  );
}