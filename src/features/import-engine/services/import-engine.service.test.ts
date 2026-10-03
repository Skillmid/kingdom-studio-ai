import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { importEngine } from "./import-engine.service";
import { storyExtractor } from "../extractors/story.extractor";

const fdxContent = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Version="1">
  <Content>
    <Paragraph Type="Scene Heading"><Text>INT. CHAPEL - NIGHT</Text></Paragraph>
    <Paragraph Type="Action"><Text>A single candle burns &amp; flickers.</Text></Paragraph>
    <Paragraph Type="Character"><Text>ELIAS</Text></Paragraph>
    <Paragraph Type="Dialogue"><Text>We are not alone.</Text></Paragraph>
  </Content>
</FinalDraft>`;

const docxFixture =
  "UEsDBBQAAAAIAIyoQ115bjPX7AAAAK0BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH2Qy07DMBBFf8XyFsUOLBBCcbrgsQQW5QMse5JYtWcsjxvSv0dpSxeosL6Pc3W7zZKimKFwIDTyVrVSADryAUcjP7evzYMUXC16GwnByAOw3PTd9pCBxZIispFTrflRa3YTJMuKMuCS4kAl2cqKyqizdTs7gr5r23vtCCtgberaIfvuGQa7j1W8LBXwtKNAZCmeTsaVZaTNOQZnayDUM/pflOZMUAXi0cNTyHyzpCj1VcKq/A04595nKCV4EB+21DebwEj9RcVrT26fAKv6v+bKThqG4OCSX9tyIQfMAccU1UVJNuDPfn28u/8GUEsDBBQAAAAIAIyoQ12b/TfqsQAAACkBAAALAAAAX3JlbHMvLnJlbHONz8FqwzAQBNBfEXuv5eQQQrDsSwjkWtwPENLaFpV2hVZNnb/PJYc49NDrMLxhumFNUd2wSGAysGtaUEiOfaDZwNd4+TiCkmrJ28iEBu4oMPTdJ0ZbA5MsIYtaUyQxsNSaT1qLWzBZaTgjrSlOXJKt0nCZdbbu286o92170OXVgK2prt5AufodqPGe8T82T1NweGb3k5DqHxNvDVCjLTNWA79cvPbPuFlTBN13enOxfwBQSwMEFAAAAAgAjKhDXQgNHA3FAAAAFwEAABEAAAB3b3JkL2RvY3VtZW50LnhtbG2PQWvDMAyF/4rxvXa2wxghSSljWwuj9JD9ANdW04AtBcld0n8/nB22wy6f4L0niddslxTVF7CMhK1+MJVWgJ7CiEOrP/u3zbNWkh0GFwmh1XcQve2auQ7kbwkwqyVFlHpu9TXnqbZW/BWSE0MT4JLihTi5LIZ4sDNxmJg8iIw4pGgfq+rJJjeiLifPFO5lTgVckLvDsTfqZb87vX6ojToe3vd9Y4tRyCvX+N+dnfIOQwR1vjGK+Tcv4POJ7Sr8/LW/nbpvUEsBAhQAFAAAAAgAjKhDXXluM9fsAAAArQEAABMAAAAAAAAAAAAAAIABAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAAUAAAACACMqENdm/036rEAAAApAQAACwAAAAAAAAAAAAAAgAEdAQAAX3JlbHMvLnJlbHNQSwECFAAUAAAACACMqENdCA0cDcUAAAAXAQAAEQAAAAAAAAAAAAAAgAH3AQAAd29yZC9kb2N1bWVudC54bWxQSwUGAAAAAAMAAwC5AAAA6wIAAAAA";

function decodeBase64(value: string): ArrayBuffer {
  const bytes = Buffer.from(value, "base64");
  const result = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(result).set(bytes);
  return result;
}

function createPdfFixture(): string {
  const stream =
    "BT /F1 12 Tf 72 720 Td (INT. CHAPEL - NIGHT) Tj ET\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const crossReferenceOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`;

  return pdf;
}

describe("screenplay import engine", () => {
  it("converts Final Draft XML paragraphs into editable screenplay text", async () => {
    const result = await importEngine.import({
      name: "chapter.fdx",
      type: "fdx",
      content: fdxContent,
    });

    assert.deepEqual(result, {
      success: true,
      screenplay: [
        "INT. CHAPEL - NIGHT",
        "A single candle burns & flickers.",
        "ELIAS",
        "We are not alone.",
      ].join("\n\n"),
      errors: [],
    });
  });

  it("rejects malformed or empty Final Draft documents without exposing XML as screenplay text", async () => {
    for (const content of ["<FinalDraft><Content>", "<FinalDraft />", ""]) {
      const result = await importEngine.import({
        name: "broken.fdx",
        type: "fdx",
        content,
      });

      assert.equal(result.success, false);
      assert.equal(result.screenplay, "");
      assert.ok(result.errors.length > 0);
    }
  });

  it("preserves plain-text imports unchanged", async () => {
    const content = "INT. CHAPEL - NIGHT\nA single candle burns.";
    const result = await importEngine.import({
      name: "chapter.txt",
      type: "txt",
      content,
    });

    assert.deepEqual(result, {
      success: true,
      screenplay: content,
      errors: [],
    });
  });

  it("extracts screenplay text from DOCX files", async () => {
    const result = await importEngine.import({
      name: "chapter.docx",
      type: "docx",
      content: decodeBase64(docxFixture),
    });

    assert.deepEqual(result, {
      success: true,
      screenplay: "INT. CHAPEL - NIGHT\n\nA candle burns.",
      errors: [],
    });
  });

  it("extracts screenplay text from PDF files", async () => {
    const result = await importEngine.import({
      name: "chapter.pdf",
      type: "pdf",
      content: await new Blob([createPdfFixture()]).arrayBuffer(),
    });

    assert.deepEqual(result, {
      success: true,
      screenplay: "INT. CHAPEL - NIGHT",
      errors: [],
    });
  });

  it("rejects malformed binary screenplay documents with an explicit error", async () => {
    for (const type of ["pdf", "docx"] as const) {
      const result = await importEngine.import({
        name: `broken.${type}`,
        type,
        content: await new Blob(["not a valid document"]).arrayBuffer(),
      });

      assert.equal(result.success, false);
      assert.equal(result.screenplay, "");
      assert.ok(result.errors[0]);
    }
  });

  it("does not mistake a character cue after the first scene for the screenplay title", async () => {
    const result = await storyExtractor.extract(
      "INT. CHAPEL - NIGHT\n\nA single candle burns.\n\nELIAS\nWe are not alone.",
    );

    assert.equal(result.title, "Untitled Screenplay");
  });

  it("recognizes an uppercase title before the first scene heading", async () => {
    const result = await storyExtractor.extract(
      "THE LAST LANTERN\n\nWritten by A. Writer\n\nINT. CHAPEL - NIGHT\nA candle burns.",
    );

    assert.equal(result.title, "THE LAST LANTERN");
  });
});
