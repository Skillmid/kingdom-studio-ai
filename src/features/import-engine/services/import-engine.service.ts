import type {
  ImportedFile,
  ImportResult,
} from "../types/import-file";
import { fdxParser } from "../parsers/fdx-parser";

export class ImportEngineService {
  async import(
    file: ImportedFile
  ): Promise<ImportResult> {
    if (file.type === "pdf" || file.type === "docx") {
      return {
        success: false,
        screenplay: "",
        errors: [`${file.type.toUpperCase()} screenplay extraction is not available yet.`],
      };
    }

    try {
      const screenplay = file.type === "fdx"
        ? fdxParser.parse(file.content)
        : file.content;

      if (!screenplay.trim()) {
        return {
          success: false,
          screenplay: "",
          errors: ["The selected screenplay is empty."],
        };
      }

      return {
        success: true,
        screenplay,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        screenplay: "",
        errors: [
          error instanceof Error
            ? error.message
            : "Unable to parse screenplay file.",
        ],
      };
    }
  }
}

export const importEngine =
  new ImportEngineService();