"use client";

import BaseField from "./BaseField";

import type { EditorField } from "../types/editor";

interface TextFieldProps {
  field: EditorField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export default function TextField({
  field,
  value,
  onChange,
}: TextFieldProps) {
  return (
    <BaseField field={field}>

      <input
        id={field.id}
        type="text"
        value={(value as string) ?? ""}
        placeholder={field.placeholder}
        disabled={field.disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-yellow-500"
      />

    </BaseField>
  );
}