import { expect, test } from "@playwright/test";

test("new production dialog exposes a named title field", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/studio", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /new production/i }).click();

  const dialog = page.getByRole("dialog", { name: "Create New Production" });
  await expect(dialog.getByLabel("Production title")).toBeVisible();
});
