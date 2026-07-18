"use client";

import type { ReactNode } from "react";

interface StoryBibleSectionProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}

export default function StoryBibleSection({
  step,
  title,
  description,
  children,
}: StoryBibleSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

      <header className="border-b border-zinc-800 bg-zinc-950/40 px-8 py-6">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-500">
          Section {step}
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {title}
        </h2>

        <p className="mt-3 max-w-3xl text-zinc-400">
          {description}
        </p>

      </header>

      <div className="space-y-6 p-8">
        {children}
      </div>

    </section>
  );
}