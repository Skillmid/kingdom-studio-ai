"use client";

import StoryBibleEditor from "./StoryBibleEditor";

import {
  SaveProvider,
  SaveStatus,
} from "@/platform/save";

interface StoryBibleWorkspaceProps {
  productionId: string;
}

export default function StoryBibleWorkspace({
  productionId,
}: StoryBibleWorkspaceProps) {
  return (
    <SaveProvider>

      <div className="mx-auto max-w-7xl space-y-8 p-8">

        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
              Kingdom Studio AI
            </p>

            <h1 className="mt-2 text-5xl font-bold">
              Story Bible
            </h1>

            <p className="mt-4 max-w-3xl text-zinc-400">
              Develop the spiritual vision, narrative foundation,
              cultural context, production direction, and creative
              intelligence that guide the entire production.
            </p>

          </div>

          <SaveStatus />

        </header>

        <StoryBibleEditor
          productionId={productionId}
        />

      </div>

    </SaveProvider>
  );
}