"use client";

import { useState } from "react";
import StudioLayout from "@/features/studio/components/StudioLayout";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import CreateProductionDialog from "@/features/productions/components/CreateProductionDialog";

interface TemplateItem {
  title: string;
  description: string;
  initialTitle: string;
}

const templates: TemplateItem[] = [
  {
    title: "Blank Production",
    description:
      "Start completely from scratch with a clean filmmaking canvas.",
    initialTitle: "Untitled Production",
  },
  {
    title: "Short Film",
    description:
      "A Kingdom short film structure with focused narrative pacing.",
    initialTitle: "Short Film - Untitled",
  },
  {
    title: "Feature Film",
    description:
      "Full cinematic production structure with three-act narrative arch.",
    initialTitle: "Feature Film - Untitled",
  },
  {
    title: "Bible Story",
    description:
      "Adapt Scripture into film with biblical integrity.",
    initialTitle: "Bible Story - Untitled",
  },
  {
    title: "Sermon Illustration",
    description:
      "Visual stories crafted for impactful preaching and teaching.",
    initialTitle: "Sermon Illustration - Untitled",
  },
  {
    title: "Children's Animation",
    description:
      "Engaging and wholesome Bible stories crafted for children.",
    initialTitle: "Children's Animation - Untitled",
  },
  {
    title: "Christmas Production",
    description:
      "Nativity and Christmas productions honoring the Incarnation.",
    initialTitle: "Christmas Film - Untitled",
  },
  {
    title: "Easter Production",
    description:
      "Death and Resurrection productions declaring victory and hope.",
    initialTitle: "Easter Film - Untitled",
  },
  {
    title: "Gospel Campaign",
    description:
      "Evangelism and outreach productions designed to share the Kingdom message.",
    initialTitle: "Gospel Outreach - Untitled",
  },
];

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  return (
    <StudioLayout>

      <section>

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          Templates
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
          Start faster with professionally designed Kingdom production templates.
          Choose a framework to launch your production workspace.
        </p>

      </section>

      <section className="mt-10">

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {templates.map((template) => (

            <button
              key={template.title}
              type="button"
              onClick={() => setSelectedTemplate(template)}
              className="group flex flex-col justify-between rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-left transition duration-300 hover:border-yellow-500 hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
            >

              <div>
                <h2 className="text-2xl font-semibold transition group-hover:text-yellow-400">
                  {template.title}
                </h2>

                <p className="mt-4 leading-7 text-zinc-400">
                  {template.description}
                </p>
              </div>

              <div className="mt-6 flex items-center text-sm font-semibold text-yellow-500">
                <span>Use Template</span>
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </div>

            </button>

          ))}

        </div>

      </section>

      <Dialog
        open={selectedTemplate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTemplate(null);
          }
        }}
      >
        <DialogContent
          title={selectedTemplate ? `Create ${selectedTemplate.title}` : "Create Production"}
          description="Name your new production to initialize your project workspace."
        >
          {selectedTemplate ? (
            <CreateProductionDialog
              initialTitle={selectedTemplate.initialTitle}
              onClose={() => setSelectedTemplate(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

    </StudioLayout>
  );
}