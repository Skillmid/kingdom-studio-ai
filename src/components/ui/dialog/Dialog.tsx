"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogTrigger({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Trigger asChild>
      {children}
    </DialogPrimitive.Trigger>
  );
}

export function DialogContent({
  title,
  description,
  children,
  className,
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>

      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />

      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl outline-none",
          className
        )}
      >

        <div className="mb-6 flex items-start justify-between">

          <div>

            <DialogPrimitive.Title className="text-2xl font-bold">

              {title}

            </DialogPrimitive.Title>

            {description && (

              <DialogPrimitive.Description className="mt-2 text-zinc-400">

                {description}

              </DialogPrimitive.Description>

            )}

          </div>

          <DialogPrimitive.Close
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </DialogPrimitive.Close>

        </div>

        {children}

      </DialogPrimitive.Content>

    </DialogPrimitive.Portal>
  );
}