import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Form QA Production",
  slug: "form-qa-production",
  status: "concept",
};

async function stubProductionData(page: import("@playwright/test").Page) {
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions")
      ? JSON.stringify(production)
      : pathname.endsWith("/story_bibles") || pathname.endsWith("/screenplays")
        ? "null"
        : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });
}

test("location creation captions label their fields", async ({ page }) => {
  await stubProductionData(page);
  await page.goto(`/studio/productions/${productionId}/locations`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add Location" }).click();

  await expect(page.getByRole("dialog", { name: "Add Location" })).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Setting", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Description", { exact: true })).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("A");
  await page.getByRole("button", { name: "Create Location" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("Location name must contain at least 2 characters.");
  await expect(page.getByLabel("Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
});

test("location save errors stay visible and announced in the open form", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "POST" && pathname.endsWith("/locations")) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Location save failed." }),
      });
      return;
    }
    const body = pathname.endsWith("/productions") ? JSON.stringify(production) : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });
  await page.goto(`/studio/productions/${productionId}/locations`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add Location" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Main House");
  await page.getByRole("button", { name: "Create Location" }).click();

  const dialog = page.getByRole("dialog", { name: "Add Location" });
  await expect(dialog.getByRole("alert")).toContainText("Location save failed.");
  expect(pageErrors).toEqual([]);
});

test("scene creation captions label the scene fields", async ({ page }) => {
  await stubProductionData(page);
  await page.goto(`/studio/productions/${productionId}/scenes`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add Scene" }).click();

  await expect(page.getByRole("dialog", { name: "Scene 1" })).toBeVisible();
  await expect(page.getByLabel("Scene Heading", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Scene Summary", { exact: true })).toBeVisible();
});

test("shot creation captions label their fields", async ({ page }) => {
  await stubProductionData(page);
  await page.goto(`/studio/productions/${productionId}/shot-list`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add Shot" }).click();

  await expect(page.getByRole("dialog", { name: "New Shot" })).toBeVisible();
  await expect(page.getByLabel("Shot number", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Shot type", { exact: true })).toBeVisible();
});

test("storyboard panel captions label their fields", async ({ page }) => {
  await stubProductionData(page);
  await page.goto(`/studio/productions/${productionId}/storyboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add Panel" }).click();

  await expect(page.getByRole("dialog", { name: "New Panel" })).toBeVisible();
  await expect(page.getByLabel("Panel number", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Visual description", { exact: true })).toBeVisible();
});

test("character creation captions label their fields", async ({ page }) => {
  await stubProductionData(page);
  await page.goto(`/studio/productions/${productionId}/characters`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add Character" }).click();

  await expect(page.getByRole("dialog", { name: "Add Character" })).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Role", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Biography", { exact: true })).toBeVisible();
});

test("location search has a clear accessible name", async ({ page }) => {
  await stubProductionData(page);
  await page.goto(`/studio/productions/${productionId}/locations`, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("searchbox", { name: "Search production locations", exact: true })).toBeVisible();
});

test("production search and sort controls have accessible names", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/studio/productions", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("searchbox", { name: "Search productions", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Sort productions", exact: true })).toBeVisible();
});
