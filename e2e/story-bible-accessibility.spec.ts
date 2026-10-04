import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Story Bible QA Production",
  slug: "story-bible-qa-production",
  status: "concept",
};

test("Story Bible field captions label their textareas", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname.endsWith("/productions")
      ? JSON.stringify(production)
      : url.pathname.endsWith("/story_bibles")
        ? "null"
        : "[]";

    await route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await page.goto(`/studio/productions/${productionId}/story-bible`, {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "Story Bible", exact: true })).toBeVisible();
  for (const label of [
    "Production Title",
    "Logline",
    "Synopsis",
    "Burden",
    "Truth",
    "Human Problem",
    "Theme",
    "Core Message",
    "Scripture Foundation",
    "Kingdom Objective",
    "Beginning",
    "Central Conflict",
    "Midpoint",
    "Climax",
    "Ending",
    "Genre",
    "Target Audience",
    "Tone",
    "Language",
    "Visual Style",
    "Aspect Ratio",
    "Duration (Minutes)",
    "Universe",
    "Time Period",
    "Primary Location",
    "Global AI Context",
    "AI Writing Rules",
    "Forbidden Elements",
    "Preferred Vocabulary",
    "Visual Consistency Rules",
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }
});
