"use client";

import { ReactNode } from "react";

interface WorkspaceLayoutProps {
  sidebar: ReactNode;

  header: ReactNode;

  children: ReactNode;

  rightPanel?: ReactNode;
}

export default function WorkspaceLayout({
  sidebar,
  header,
  children,
  rightPanel,
}: WorkspaceLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* Left Sidebar */}

      <aside className="w-72 border-r border-zinc-800 bg-zinc-950">

        {sidebar}

      </aside>

      {/* Main Area */}

      <div className="flex flex-1 flex-col">

        {header}

        <main className="flex-1 overflow-y-auto bg-black p-8">

          {children}

        </main>

      </div>

      {/* Optional Right Panel */}

      {rightPanel && (

        <aside className="w-80 border-l border-zinc-800 bg-zinc-950">

          {rightPanel}

        </aside>

      )}

    </div>
  );
}