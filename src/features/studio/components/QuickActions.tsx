"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import CreateProductionDialog from "@/features/productions/components/CreateProductionDialog";
import { useLatestProduction } from "@/features/productions/hooks/use-latest-production";

const actions = [
  {
    title: "New Production",
    description: "Start building a new film project.",
  },
  {
    title: "AI Director",
    description: "Plan your next scene with AI.",
  },
  {
    title: "Continue Story",
    description: "Resume writing your screenplay.",
  },
];

export default function QuickActions() {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const { production } =
    useLatestProduction();

  function handleAction(
    title: string
  ) {
    switch (title) {
      case "New Production":
        setOpen(true);
        break;

      case "Continue Story":
        if (production) {
          router.push(
            `/studio/productions/${production.id}`
          );
        } else {
          setOpen(true);
        }
        break;

      case "AI Director":
        router.push(
          "/studio/ai-director"
        );
        break;
    }
  }

  return (
    <>
      <section className="mt-8">

        <h2 className="mb-6 text-2xl font-semibold">
          Quick Actions
        </h2>

        <div className="grid gap-6 md:grid-cols-3">

          {actions.map((action) => (

            <Button
              key={action.title}
              variant="secondary"
              onClick={() =>
                handleAction(
                  action.title
                )
              }
              className="h-full rounded-2xl p-6 text-left"
            >
              <div>

                <h3 className="text-xl font-semibold">
                  {action.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {action.description}
                </p>

              </div>

            </Button>

          ))}

        </div>

      </section>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent
          title="Create New Production"
          description="Create a new Kingdom film project."
        >
          <CreateProductionDialog
            onClose={() =>
              setOpen(false)
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}