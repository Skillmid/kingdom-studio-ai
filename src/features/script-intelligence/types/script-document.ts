import type {
  ImportFileType,
} from "@/features/import-engine";

export interface ScriptDocument {
  productionId: string;

  title: string;

  content: string;

  source: ImportFileType;

  fileName?: string;

  createdAt?: string;

  updatedAt?: string;
}