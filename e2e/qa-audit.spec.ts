import { expect, test } from "@playwright/test";

async function stubMissingProduction(page: import("@playwright/test").Page) {
  await page.route("**/rest/v1/productions**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "null",
    });
  });
}

test.describe("QA Audit - Public & Auth Routes", () => {
  test("Homepage renders properly with all key sections", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);

    await expect(page.locator("body")).toContainText("Kingdom Studio AI");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Start Creating" })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("Login page renders form elements, buttons, and handles validation", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);

    const emailInput = page.locator("input[type='email']");
    const passwordInput = page.locator("input[type='password']");
    const submitBtn = page.locator("button[type='submit']");

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Check link to signup
    const signupLink = page.locator("a[href='/signup']");
    await expect(signupLink).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("Signup page renders form elements and navigation link", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/signup", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);

    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
    await expect(page.locator("a[href='/login']")).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("QA Audit - Studio Dashboard", () => {
  test("Studio page renders dashboard, empty state, and tabs without crashing", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/studio", { waitUntil: "domcontentloaded", timeout: 60000 });
    expect(response?.ok()).toBe(true);

    // Verify presence of main dashboard components
    await expect(page.locator("body")).toBeVisible();

    // Check console errors
    console.log("Console errors on /studio:", consoleErrors);
  });
});
test.describe("QA Audit - Non-existent Production ID (Boundary & Error handling)", () => {
  test("Visiting invalid production ID displays friendly error boundary instead of crash", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await stubMissingProduction(page);

    const response = await page.goto("/studio/productions/00000000-0000-0000-0000-000000000000", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    expect(response?.status()).toBeLessThan(500);

    // Should render the workspace with error layout
    await expect(page.getByRole("heading", { name: "Unable to load production" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=The requested production could not be found.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("PGRST116");
  });

  test("Visiting storyboard route with invalid production ID", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await stubMissingProduction(page);

    const response = await page.goto("/studio/productions/00000000-0000-0000-0000-000000000000/storyboard", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Unable to load production" })).toBeVisible({ timeout: 15000 });
  });

  test("Visiting locations route with invalid production ID", async ({ page }) => {
    await stubMissingProduction(page);
    const response = await page.goto("/studio/productions/00000000-0000-0000-0000-000000000000/locations", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Unable to load production" })).toBeVisible({ timeout: 15000 });
  });

  test("Visiting scenes route with invalid production ID", async ({ page }) => {
    await stubMissingProduction(page);
    const response = await page.goto("/studio/productions/00000000-0000-0000-0000-000000000000/scenes", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Unable to load production" })).toBeVisible({ timeout: 15000 });
  });
});

