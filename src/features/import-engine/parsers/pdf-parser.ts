import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFPageProxy } from "pdfjs-dist";

type TextContentItem = Awaited<ReturnType<PDFPageProxy["getTextContent"]>>["items"][number];
type PdfTextItem = Extract<TextContentItem, { str: string }>;

interface PositionedText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL: boolean;
}

interface TextLine {
  y: number;
  height: number;
  breakBefore: string;
  items: PositionedText[];
}

function toPositionedText(item: PdfTextItem): PositionedText {
  return {
    text: item.str,
    x: Number(item.transform[4]),
    y: Number(item.transform[5]),
    width: item.width,
    height: item.height,
    hasEOL: item.hasEOL,
  };
}

function formatLine(line: TextLine): string {
  const text = line.items.reduce((result, item, index) => {
    if (index === 0) return item.text;

    const previous = line.items[index - 1];
    const gap = item.x - previous.x - previous.width;
    const needsSpace =
      gap > Math.max(1, Math.min(previous.height, item.height) * 0.2) &&
      !result.endsWith(" ") &&
      !item.text.startsWith(" ");

    return `${result}${needsSpace ? " " : ""}${item.text}`;
  }, "");

  return text.replace(/[ \t]+/g, " ").trim();
}

function formatPage(items: TextContentItem[]): string {
  const lines: TextLine[] = [];
  let previousItem: PositionedText | null = null;

  for (const item of items) {
    if (!("str" in item) || !item.str.trim()) continue;

    const positioned = toPositionedText(item);
    const currentLine = lines.at(-1);
    const verticalGap = currentLine
      ? Math.abs(positioned.y - currentLine.y)
      : 0;
    const lineHeight = Math.max(positioned.height, currentLine?.height ?? 0);
    const startsNewLine =
      !currentLine ||
      previousItem?.hasEOL ||
      verticalGap > Math.max(2, lineHeight * 0.5);

    if (startsNewLine) {
      const breakBefore = currentLine
        ? verticalGap > Math.max(8, lineHeight * 1.5)
          ? "\n\n"
          : "\n"
        : "";

      lines.push({
        y: positioned.y,
        height: positioned.height,
        breakBefore,
        items: [positioned],
      });
    } else {
      currentLine.items.push(positioned);
      currentLine.height = Math.max(currentLine.height, positioned.height);
    }

    previousItem = positioned;
  }

  return lines
    .map((line) => `${line.breakBefore}${formatLine(line)}`)
    .join("")
    .trim();
}

export class PDFParser {
  async parse(content: ArrayBuffer): Promise<string> {
    if (content.byteLength === 0) {
      throw new Error("The selected PDF file is empty.");
    }

    GlobalWorkerOptions.workerSrc = new URL(
      "../../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const loadingTask = getDocument({
      data: new Uint8Array(content),
      isEvalSupported: false,
    });

    try {
      const document = await loadingTask.promise;
      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = formatPage(textContent.items);

        if (pageText) pages.push(pageText);
      }

      const screenplay = pages.join("\n\n").trim();
      if (!screenplay) {
        throw new Error("The PDF document does not contain extractable screenplay text.");
      }

      return screenplay;
    } finally {
      await loadingTask.destroy();
    }
  }
}

export const pdfParser = new PDFParser();
