import { expect, test } from "@playwright/test";

test("Studio navigation stays reachable and does not overflow on small screens", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/studio", { waitUntil: "domcontentloaded" });

  const mobileNavigationButton = page.getByRole("button", { name: /Navigate Studio/ });
  await expect(mobileNavigationButton).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await mobileNavigationButton.click();

  const mobileNavigation = page.getByRole("navigation", { name: "Studio sections" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  await mobileNavigation.getByRole("link", { name: "Productions" }).click();
  await expect(page).toHaveURL("/studio/productions");
  await expect(mobileNavigationButton).toHaveAttribute("aria-expanded", "false");

  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (width < 1024) {
      await expect(page.getByRole("button", { name: /Navigate Studio/ })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Studio sections" })).toBeHidden();
    } else {
      await expect(page.getByRole("navigation", { name: "Studio sections" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Navigate Studio/ })).toBeHidden();
    }
  }
});
