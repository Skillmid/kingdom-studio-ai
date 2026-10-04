import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Screenplay QA Production",
  slug: "screenplay-qa-production",
  status: "concept",
};

test("screenplay editor and paste areas have distinct accessible names", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions")
      ? JSON.stringify(production)
      : pathname.endsWith("/screenplays")
        ? "null"
        : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await page.goto(`/studio/productions/${productionId}/screenplay`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Screenplay text", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Paste Script" }).click();
  await expect(page.getByRole("textbox", { name: "Paste screenplay", exact: true })).toBeVisible();
});
