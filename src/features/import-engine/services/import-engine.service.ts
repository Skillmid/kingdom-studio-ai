import type {
  ImportedFile,
  ImportResult,
} from "../types/import-file";
import { fdxParser } from "../parsers/fdx-parser";

export class ImportEngineService {
  async import(file: ImportedFile): Promise<ImportResult> {
    try {
      let screenplay: string;

      if (file.type === "pdf") {
        if (typeof file.content === "string") {
          throw new Error("PDF import requires the original binary file content.");
        }

        const { pdfParser } = await import("../parsers/pdf-parser");
        screenplay = await pdfParser.parse(file.content);
      } else if (file.type === "docx") {
        if (typeof file.content === "string") {
          throw new Error("DOCX import requires the original binary file content.");
        }

        const { docxParser } = await import("../parsers/docx-parser");
        screenplay = await docxParser.parse(file.content);
      } else {
        if (typeof file.content !== "string") {
          throw new Error(`${file.type.toUpperCase()} import requires text content.`);
        }

        screenplay = file.type === "fdx"
          ? fdxParser.parse(file.content)
          : file.content;
      }

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

export const importEngine = new ImportEngineService();
