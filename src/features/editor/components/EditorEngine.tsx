"use client";

import EditorSection from "./EditorSection";

import type {
  EditorSchema,
} from "../types/editor";

interface EditorEngineProps {
  schema: EditorSchema;

  values: Record<string, unknown>;

  onChange: (fieldId: string, value: unknown) => void;
}

export default function EditorEngine({
  schema,
  values,
  onChange,
}: EditorEngineProps) {
  return (
    <div className="space-y-10">

      {schema.sections.map((section) => (

        <EditorSection
          key={section.id}
          section={section}
          values={values}
          onChange={onChange}
        />

      ))}

    </div>
  );
}