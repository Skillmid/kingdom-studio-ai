"use client";

import { use } from "react";

import { ScriptWorkspace } from "@/features/script-intelligence";

interface ScreenplayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ScreenplayPage({
  params,
}: ScreenplayPageProps) {
  const { id } = use(params);

  return (
    <ScriptWorkspace
      productionId={id}
    />
  );
}