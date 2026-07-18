"use client";

interface WorkspaceHeaderProps {
  title: string;

  subtitle?: string;

  actions?: React.ReactNode;
}

export default function WorkspaceHeader({
  title,
  subtitle,
  actions,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8 py-5">

      <div>

        <h1 className="text-3xl font-bold">

          {title}

        </h1>

        {subtitle && (

          <p className="mt-1 text-zinc-400">

            {subtitle}

          </p>

        )}

      </div>

      {actions && (

        <div className="flex items-center gap-3">

          {actions}

        </div>

      )}

    </header>
  );
}