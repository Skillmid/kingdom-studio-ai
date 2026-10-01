import { expect, test } from "@playwright/test";

test("opens and renders the local application homepage", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toContainText("Kingdom Studio AI");
});

test("opens and renders the login page", async ({ page }) => {
  const response = await page.goto("/login", { waitUntil: "domcontentloaded" });

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toContainText(/\S/);
});
