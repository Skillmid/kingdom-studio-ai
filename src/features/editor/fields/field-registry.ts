import { ComponentType } from "react";

import TextField from "./TextField";
import TextAreaField from "./TextAreaField";

import type { EditorField } from "../types/editor";

export interface EditorFieldComponentProps {
  field: EditorField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export type EditorFieldComponent =
  ComponentType<EditorFieldComponentProps>;

const registry = new Map<string, EditorFieldComponent>();

registry.set("text", TextField);
registry.set("textarea", TextAreaField);

export function registerField(
  type: string,
  component: EditorFieldComponent
) {
  registry.set(type, component);
}

export function getFieldComponent(
  type: string
): EditorFieldComponent | undefined {
  return registry.get(type);
}