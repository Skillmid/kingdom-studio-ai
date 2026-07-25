"use client";

import {
  getFieldComponent,
} from "../fields/field-registry";

import type {
  EditorField as EditorFieldType,
} from "../types/editor";

interface EditorFieldProps {
  field: EditorFieldType;
  value: unknown;
  onChange: (value: unknown) => void;
}

export default function EditorField({
  field,
  value,
  onChange,
}: EditorFieldProps) {
  const Component = getFieldComponent(field.type);

  if (!Component) {
    return (
      <div className="rounded-xl border border-dashed border-red-700 bg-red-950/20 p-6">

        <p className="font-medium text-red-400">
          Unsupported field type
        </p>

        <p className="mt-2 text-sm text-red-300">
          "{field.type}" has not been registered.
        </p>

      </div>
    );
  }

  return (
    <Component
      field={field}
      value={value}
      onChange={onChange}
    />
  );
}