export type ImportFileType =
  | "pdf"
  | "docx"
  | "txt"
  | "fdx"
  | "fountain"
  | "markdown";

export interface ImportedFile {
  name: string;

  type: ImportFileType;

  content: string;
}

export interface ImportResult {
  success: boolean;

  screenplay: string;

  errors: string[];
}