"use client";

import TextAreaField from "../fields/TextAreaField";
import TextField from "../fields/TextField";

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
  switch (field.type) {
    case "text":
      return (
        <TextField
          field={field}
          value={value}
          onChange={onChange}
        />
      );
    case "textarea":
      return (
        <TextAreaField
          field={field}
          value={value}
          onChange={onChange}
        />
      );
    default:
      return (
        <div className="rounded-xl border border-dashed border-red-700 bg-red-950/20 p-6">
          <p className="font-medium text-red-400">
            Unsupported field type
          </p>
          <p className="mt-2 text-sm text-red-300">
            &quot;{field.type}&quot; has not been registered.
          </p>
        </div>
      );
  }
}
