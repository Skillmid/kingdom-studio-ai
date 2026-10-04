import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Asset QA Production",
  slug: "asset-qa-production",
  status: "concept",
};

test("asset media URL field shows a readable example address", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions") ? JSON.stringify(production) : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await page.goto(`/studio/productions/${productionId}/assets`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: "Add asset" }).click();

  const mediaUrl = page.getByLabel("Media URL (optional)");
  await expect(mediaUrl).toBeVisible();
  await expect(mediaUrl).toHaveAttribute("placeholder", "https://example.com/media");
});
