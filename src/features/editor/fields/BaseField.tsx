"use client";

import { ReactNode } from "react";

import type { EditorField } from "../types/editor";

interface BaseFieldProps {
  field: EditorField;
  children: ReactNode;
  error?: string;
}

export default function BaseField({
  field,
  children,
  error,
}: BaseFieldProps) {
  return (
    <div className="space-y-3">

      <div>

        <label
          htmlFor={field.id}
          className="block text-sm font-semibold text-zinc-100"
        >
          {field.label}

          {field.required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>

        {field.description && (
          <p className="mt-1 text-sm text-zinc-400">
            {field.description}
          </p>
        )}

      </div>

      {children}

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}