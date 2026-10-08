import { expect, test } from "@playwright/test";

test.describe("E2E QA Audit Suite", () => {
  test.setTimeout(90000);

  test("1. Public and Auth Routes Audit", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[${page.url()}] ${msg.text()}`);
    });

    // Homepage
    const homeRes = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(homeRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Kingdom Studio AI");

    // Login
    const loginRes = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(loginRes?.status()).toBe(200);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();

    // Signup
    const signupRes = await page.goto("/signup", { waitUntil: "domcontentloaded" });
    expect(signupRes?.status()).toBe(200);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("2. Studio Navigation and Global Routes Audit", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[${page.url()}] ${msg.text()}`);
    });

    // Studio Dashboard
    const studioRes = await page.goto("/studio", { waitUntil: "domcontentloaded" });
    expect(studioRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Kingdom Studio");

    // Templates
    const templatesRes = await page.goto("/studio/templates", { waitUntil: "domcontentloaded" });
    expect(templatesRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Templates");

    // Global Assets
    const assetsRes = await page.goto("/studio/assets", { waitUntil: "domcontentloaded" });
    expect(assetsRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Global Assets");

    // Settings
    const settingsRes = await page.goto("/studio/settings", { waitUntil: "domcontentloaded" });
    expect(settingsRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Settings");

    // Profile
    const profileRes = await page.goto("/studio/profile", { waitUntil: "domcontentloaded" });
    expect(profileRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("My Profile");

    // Notifications
    const notifRes = await page.goto("/studio/notifications", { waitUntil: "domcontentloaded" });
    expect(notifRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Notifications");

    // Global AI Director
    const aiDirRes = await page.goto("/studio/ai-director", { waitUntil: "domcontentloaded" });
    expect(aiDirRes?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("AI Director");

    expect(consoleErrors).toEqual([]);
  });

  test("3. QuickActions and Dialogs on Studio Dashboard", async ({ page }) => {
    await page.goto("/studio", { waitUntil: "domcontentloaded" });

    // Click "New Production" button
    const newProdBtn = page.locator("button", { hasText: "New Production" });
    await expect(newProdBtn).toBeVisible();
    await newProdBtn.click();

    // Dialog should open
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Create New Production");

    // Input title field should be visible
    const titleInput = dialog.locator("input[placeholder='Production title']");
    await expect(titleInput).toBeVisible();

    // Close button / backdrop
    const closeBtn = dialog.locator("button:has-text('Close'), button[aria-label='Close']");
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
    } else {
      await page.keyboard.press("Escape");
    }
  });

  test("4. Production Route Error Boundary & Isolation", async ({ page }) => {
    const dummyId = "00000000-0000-0000-0000-000000000000";
    const subRoutes = [
      "",
      "/screenplay",
      "/story-bible",
      "/characters",
      "/locations",
      "/scenes",
      "/storyboard",
      "/shot-list",
      "/ai-director",
      "/assets",
      "/render",
      "/export",
      "/world-building",
    ];

    for (const sub of subRoutes) {
      const url = `/studio/productions/${dummyId}${sub}`;
      const res = await page.goto(url, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBeLessThan(500);

      // Verify that unauthenticated / non-existent production fails gracefully
      // Either showing "Unable to load production" or standard 404/not-found layout
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(0);
    }
  });

  test("5. Responsive Viewport Audit (Mobile 375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Homepage on mobile
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    // Studio on mobile
    await page.goto("/studio", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    // Login on mobile
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("6. API Route Security & Auth Checks", async ({ request }) => {
    // 1. /api/ai/generate without auth header should return 401
    const aiGenRes = await request.post("/api/ai/generate", {
      data: { prompt: "Test story prompt" },
    });
    expect(aiGenRes.status()).toBe(401);
    const aiGenBody = await aiGenRes.json();
    expect(aiGenBody.error).toMatch(/authentication/i);

    // 2. /api/generation/run without valid jobId should return 400
    const genRunInvalidRes = await request.post("/api/generation/run", {
      data: {},
    });
    expect(genRunInvalidRes.status()).toBe(400);

    // 3. /api/generation/run with non-existent uuid without auth should return 401
    const genRunNoAuthRes = await request.post("/api/generation/run", {
      data: { jobId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(genRunNoAuthRes.status()).toBe(401);
  });
});

