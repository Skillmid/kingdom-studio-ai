import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className,
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-lg",
        className
      )}
    >
      {children}
    </section>
  );
}