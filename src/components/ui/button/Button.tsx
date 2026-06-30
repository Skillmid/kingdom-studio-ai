import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition-all duration-300",
        variant === "primary" &&
          "bg-yellow-500 text-black hover:bg-yellow-400",
        variant === "secondary" &&
          "border border-zinc-700 bg-zinc-900 text-white hover:border-yellow-500",
        variant === "ghost" &&
          "bg-transparent text-zinc-300 hover:bg-zinc-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}