"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import CreateProductionDialog from "@/features/productions/components/CreateProductionDialog";

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
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="mt-8">
        <h2 className="mb-6 text-2xl font-semibold">
          Quick Actions
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {actions.map((action) => {
            if (action.title === "New Production") {
              return (
                <Button
                  key={action.title}
                  variant="secondary"
                  onClick={() => setOpen(true)}
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
              );
            }

            return (
              <button
                key={action.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition duration-300 hover:border-yellow-500 hover:bg-zinc-800"
              >
                <h3 className="text-xl font-semibold">
                  {action.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {action.description}
                </p>
              </button>
            );
          })}
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
          <CreateProductionDialog />
        </DialogContent>
      </Dialog>
    </>
  );
}