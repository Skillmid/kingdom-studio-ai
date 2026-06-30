import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between">

      <div>

        <h2 className="text-3xl font-bold">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-2 text-zinc-400">
            {subtitle}
          </p>
        )}

      </div>

      {action}

    </div>
  );
}