"use client";

import EditorSection from "./EditorSection";

import type {
  EditorSchema,
} from "@/features/editor/types/editor";

interface EditorEngineProps {
  schema: EditorSchema;
}

export default function EditorEngine({
  schema,
}: EditorEngineProps) {
  return (
    <div className="space-y-10">
      {schema.sections.map((section) => (
        <EditorSection
          key={section.id}
          section={section}
        />
      ))}
    </div>
  );
}