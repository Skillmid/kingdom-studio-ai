export type EditorFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "url"
  | "date"
  | "boolean"
  | "select"
  | "multiselect"
  | "tags"
  | "color"
  | "image"
  | "gallery"
  | "relationship"
  | "reference";

export interface EditorFieldOption {
  label: string;
  value: string;
}

export interface EditorField {
  id: string;

  type: EditorFieldType;

  label: string;

  description?: string;

  placeholder?: string;

  required?: boolean;

  disabled?: boolean;

  options?: EditorFieldOption[];

  aiEnabled?: boolean;

  defaultValue?: unknown;
}

export interface EditorSection {
  id: string;

  title: string;

  description?: string;

  fields: EditorField[];
}

export interface EditorSchema {
  id: string;

  title: string;

  description?: string;

  sections: EditorSection[];
}




