"use client";

interface AISectionHeaderProps {
  title: string;
  description: string;
}

export default function AISectionHeader({
  title,
  description,
}: AISectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-6">

      <div>

        <h2 className="text-3xl font-bold">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-zinc-400">
          {description}
        </p>

      </div>

      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">

        <p className="text-sm font-medium text-yellow-400">
          AI Assisted
        </p>

      </div>

    </div>
  );
}