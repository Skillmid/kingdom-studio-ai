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

  it("does not claim unsupported PDF or DOCX extraction succeeded", async () => {
    for (const type of ["pdf", "docx"] as const) {
      const result = await importEngine.import({
        name: `chapter.${type}`,
        type,
        content: "binary content",
      });

      assert.equal(result.success, false);
      assert.equal(result.screenplay, "");
      assert.match(result.errors[0], new RegExp(type.toUpperCase()));
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
