"use client";

import EditorField from "./EditorField";

import type {
  EditorSection as EditorSectionType,
} from "../types/editor";

interface EditorSectionProps {
  section: EditorSectionType;

  values: Record<string, unknown>;

  onChange: (
    fieldId: string,
    value: unknown
  ) => void;
}

export default function EditorSection({
  section,
  values,
  onChange,
}: EditorSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">

      <div className="mb-8">

        <h2 className="text-2xl font-bold">

          {section.title}

        </h2>

        {section.description && (

          <p className="mt-2 text-zinc-400">

            {section.description}

          </p>

        )}

      </div>

      <div className="grid gap-6">

        {section.fields.map((field) => (

          <EditorField
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(value) =>
              onChange(field.id, value)
            }
          />

        ))}

      </div>

    </section>
  );
}