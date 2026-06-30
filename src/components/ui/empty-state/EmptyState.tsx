interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-16 text-center">

      <h3 className="text-2xl font-semibold">
        {title}
      </h3>

      <p className="mt-4 text-zinc-400">
        {description}
      </p>

    </div>
  );
}