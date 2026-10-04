import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Responsive QA Production",
  slug: "responsive-qa-production",
  status: "concept",
};

test("production workspace stays usable and keeps every section reachable across viewport sizes", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const isProductionDetail = url.pathname.endsWith("/productions") && url.searchParams.has("id");

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: isProductionDetail ? JSON.stringify(production) : "[]",
    });
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/studio/productions/${productionId}/scenes`, { waitUntil: "domcontentloaded" });

  const sceneHeading = page.getByRole("heading", { name: "Scenes", exact: true });
  await expect(sceneHeading).toBeVisible();
  const contentWidth = await sceneHeading.evaluate((heading) =>
    heading.closest("main")?.getBoundingClientRect().width ?? 0,
  );
  expect(contentWidth).toBeGreaterThan(340);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();

  const mobileNavigationButton = page.getByRole("button", { name: /Navigate production/ });
  await expect(mobileNavigationButton).toBeVisible();
  await mobileNavigationButton.click();
  await page.getByRole("navigation", { name: "Production sections" }).getByRole("link", { name: "World Building" }).click();
  await expect(page).toHaveURL(new RegExp(`/studio/productions/${productionId}/world-building$`));
  await expect(page.getByRole("heading", { name: "World Building" })).toBeVisible();

  for (const width of [768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "World Building" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

    const mainWidth = await page.getByRole("heading", { name: "World Building" }).evaluate((heading) =>
      heading.closest("main")?.getBoundingClientRect().width ?? 0,
    );
    expect(mainWidth).toBeGreaterThan(width < 1024 ? width - 24 : width - 320);

    if (width < 1024) {
      await expect(page.getByRole("button", { name: /Navigate production/ })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Production sections" })).toBeHidden();
    } else {
      await expect(page.getByRole("navigation", { name: "Production sections" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Navigate production/ })).toBeHidden();
    }
  }
});

test("production header Export action opens the export workspace", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions") ? JSON.stringify(production) : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await page.goto(`/studio/productions/${productionId}/scenes`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Export", exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/studio/productions/${productionId}/export$`));
  await expect(page.getByRole("heading", { name: "Export packages" })).toBeVisible();
});
