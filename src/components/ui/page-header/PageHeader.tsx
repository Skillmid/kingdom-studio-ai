interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <header className="mb-10">

      <h1 className="text-4xl font-bold">
        {title}
      </h1>

      {description && (
        <p className="mt-3 text-zinc-400">
          {description}
        </p>
      )}

    </header>
  );
}