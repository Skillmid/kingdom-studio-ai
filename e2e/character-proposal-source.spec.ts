import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const screenplayId = "33333333-3333-4333-8333-333333333333";
const revisionId = "44444444-4444-4444-8444-444444444444";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Character QA Production",
  slug: "character-qa-production",
  status: "concept",
};
const screenplayContent = "MARA\nI am a careful witness.";
const screenplay = {
  id: screenplayId,
  production_id: productionId,
  title: "The Witness",
  content: screenplayContent,
  source: "internal",
  source_file_name: null,
  version: 1,
  status: "draft",
  created_at: "2026-10-04T00:00:00.000Z",
  updated_at: "2026-10-04T00:00:00.000Z",
};
const character = {
  id: "55555555-5555-4555-8555-555555555555",
  production_id: productionId,
  name: "Mara",
  role: "lead",
  status: "draft",
  age: null,
  gender: null,
  occupation: null,
  nationality: null,
  ethnicity: null,
  biography: null,
  appearance: null,
  height: null,
  weight: null,
  eye_color: null,
  hair_color: null,
  distinguishing_features: null,
  personality: null,
  strengths: null,
  weaknesses: null,
  fears: null,
  habits: null,
  values: null,
  motivation: null,
  goal: null,
  conflict: null,
  character_arc: null,
  spiritual_journey: null,
  speech_style: null,
  catch_phrases: null,
  ai_instructions: null,
  progress: 0,
  profile_provenance: null,
  created_at: "2026-10-04T00:00:00.000Z",
  updated_at: "2026-10-04T00:00:00.000Z",
};

test("character proposal identifies its screenplay revision in readable text", async ({ page }) => {
  await page.route("**/api/ai/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        text: JSON.stringify({
          fields: { biography: "A careful witness." },
          fieldEvidence: { biography: "MARA I am a careful witness." },
        }),
      }),
    });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions")
      ? JSON.stringify(production)
      : pathname.endsWith("/characters")
        ? JSON.stringify([character])
        : pathname.endsWith("/screenplays")
          ? JSON.stringify(screenplay)
          : pathname.endsWith("/screenplay_revisions")
            ? JSON.stringify([{ id: revisionId, screenplay_id: screenplayId, version: 1 }])
            : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await page.goto(`/studio/productions/${productionId}/characters`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Role", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Age", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Generate proposal" }).click();

  await expect(page.getByText(`Source: The Witness, version 1, revision ${revisionId}`)).toBeVisible();
});
