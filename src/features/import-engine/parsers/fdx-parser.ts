import { XMLParser, XMLValidator } from "fast-xml-parser";

function collectText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join("");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    const textNode = entries.find(([key]) => key === "#text");
    if (textNode) return collectText(textNode[1]);

    return entries
      .filter(([key]) => !key.startsWith("@_"))
      .map(([, nested]) => collectText(nested))
      .join("");
  }

  return "";
}

export class FDXParser {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: false,
    processEntities: {
      enabled: true,
      maxEntitySize: 2_048,
      maxExpansionDepth: 8,
      maxTotalExpansions: 10_000,
      maxExpandedLength: 1_000_000,
      maxEntityCount: 100,
    },
  });

  parse(content: string): string {
    if (!content.trim()) {
      throw new Error("The selected FDX file is empty.");
    }

    if (XMLValidator.validate(content) !== true) {
      throw new Error("The FDX document is not valid XML.");
    }

    const document = this.parser.parse(content);
    const paragraphs = document?.FinalDraft?.Content?.Paragraph;
    const paragraphList = Array.isArray(paragraphs)
      ? paragraphs
      : paragraphs
        ? [paragraphs]
        : [];
    const screenplay = paragraphList
      .map((paragraph: { Text?: unknown }) => collectText(paragraph.Text).trim())
      .filter(Boolean)
      .join("\n\n");

    if (!screenplay) {
      throw new Error("The FDX document does not contain screenplay paragraphs.");
    }

    return screenplay;
  }
}

export const fdxParser = new FDXParser();
