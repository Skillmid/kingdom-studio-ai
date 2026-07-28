import type {
  ImportedFile,
  ImportResult,
} from "../types/import-file";

export class ImportEngineService {
  async import(
    file: ImportedFile
  ): Promise<ImportResult> {
    return {
      success: true,

      screenplay: file.content,

      errors: [],
    };
  }
}

export const importEngine =
  new ImportEngineService();