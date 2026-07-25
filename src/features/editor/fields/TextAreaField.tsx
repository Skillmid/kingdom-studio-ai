"use client";

import BaseField from "./BaseField";

import type { EditorField } from "../types/editor";

interface TextAreaFieldProps {
  field: EditorField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export default function TextAreaField({
  field,
  value,
  onChange,
}: TextAreaFieldProps) {
  return (
    <BaseField field={field}>

      <textarea
        id={field.id}
        rows={6}
        value={(value as string) ?? ""}
        placeholder={field.placeholder}
        disabled={field.disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-yellow-500"
      />

    </BaseField>
  );
}