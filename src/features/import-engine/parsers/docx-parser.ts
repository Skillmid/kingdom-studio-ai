import mammoth from "mammoth/mammoth.browser.js";

export class DOCXParser {
  async parse(content: ArrayBuffer): Promise<string> {
    if (content.byteLength === 0) {
      throw new Error("The selected DOCX file is empty.");
    }

    const result = await mammoth.extractRawText({
      arrayBuffer: content,
    });
    const screenplay = result.value.trim();

    if (!screenplay) {
      throw new Error("The DOCX document does not contain screenplay text.");
    }

    return screenplay;
  }
}

export const docxParser = new DOCXParser();
