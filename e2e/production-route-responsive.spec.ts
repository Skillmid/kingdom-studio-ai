import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Viewport QA Production",
  slug: "viewport-qa-production",
  status: "concept",
};
const sections = [
  "",
  "/screenplay",
  "/story-bible",
  "/characters",
  "/locations",
  "/world-building",
  "/scenes",
  "/shot-list",
  "/storyboard",
  "/ai-director",
  "/assets",
  "/render",
  "/export",
];

test("production sections render without horizontal overflow at common viewport sizes", async ({ page }) => {
  test.setTimeout(120000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions")
      ? JSON.stringify(production)
      : pathname.endsWith("/story_bibles") || pathname.endsWith("/screenplays")
        ? "null"
        : "[]";

    await route.fulfill({ status: 200, contentType: "application/json", body });
  });

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });

    for (const section of sections) {
      const response = await page.goto(`/studio/productions/${productionId}${section}`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), `${section || "/"} at ${width}px`).toBeLessThan(500);
      await expect(page.locator("h1").first()).toBeVisible();
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth, `${section || "/"} at ${width}px`).toBeLessThanOrEqual(width);
    }
  }

  expect(browserErrors).toEqual([]);
});
