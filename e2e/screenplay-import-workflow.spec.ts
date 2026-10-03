import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Local Import Preview",
  slug: "local-import-preview",
  logline: null,
  synopsis: null,
  genre: null,
  target_audience: null,
  art_style: null,
  language: "en",
  aspect_ratio: "16:9",
  target_duration_seconds: 90,
  cover_image_url: null,
  status: "concept",
  visibility: "private",
  created_at: "2026-10-03T00:00:00.000Z",
  updated_at: "2026-10-03T00:00:00.000Z",
  last_opened_at: null,
  deleted_at: null,
};

const fdx = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Version="1">
  <Content>
    <Paragraph Type="Scene Heading"><Text>INT. CHAPEL - NIGHT</Text></Paragraph>
    <Paragraph Type="Action"><Text>A single candle burns.</Text></Paragraph>
    <Paragraph Type="Character"><Text>ELIAS</Text></Paragraph>
    <Paragraph Type="Dialogue"><Text>We are not alone.</Text></Paragraph>
  </Content>
</FinalDraft>`;

test("imports FDX into editable screenplay text and gates intelligence until save", async ({ page }) => {
  const writes: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method())) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });

  await page.route("**/rest/v1/productions**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(production),
    });
  });
  await page.route("**/rest/v1/screenplays**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });

  const response = await page.goto(`/studio/productions/${productionId}/screenplay`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(200);

  await page.locator('input[type="file"]').setInputFiles({
    name: "chapel.fdx",
    mimeType: "application/xml",
    buffer: Buffer.from(fdx),
  });

  const editor = page.locator("textarea").last();
  await expect(editor).toHaveValue(
    "INT. CHAPEL - NIGHT\n\nA single candle burns.\n\nELIAS\n\nWe are not alone.",
  );
  await expect(page.getByRole("textbox", { name: "Screenplay Title" })).toHaveValue("chapel");
  await expect(page.getByText("Script Context Extracted")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyse Screenplay" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Extract Scenes" })).toBeDisabled();
  expect(writes).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
