import { ReactNode } from "react";
import StudioSidebar from "./StudioSidebar";
import StudioHeader from "./StudioHeader";

interface StudioLayoutProps {
  children: ReactNode;
}

export default function StudioLayout({
  children,
}: StudioLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex">

        <StudioSidebar />

        <div className="flex min-h-screen flex-1 flex-col">

          <StudioHeader />

          <main className="flex-1 p-8">
            {children}
          </main>

        </div>

      </div>
    </div>
  );
}