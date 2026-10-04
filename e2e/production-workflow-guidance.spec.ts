import { expect, test } from "@playwright/test";

const productionId = "11111111-1111-4111-8111-111111111111";
const production = {
  id: productionId,
  owner_id: "22222222-2222-4222-8222-222222222222",
  created_by: "22222222-2222-4222-8222-222222222222",
  title: "Workflow QA Production",
  slug: "workflow-qa-production",
  status: "concept",
  updated_at: "2026-10-04T00:00:00.000Z",
};

async function openProduction(page: import("@playwright/test").Page) {
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions") ? JSON.stringify(production) : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });
  await page.goto(`/studio/productions/${productionId}`, { waitUntil: "domcontentloaded" });
}

test("production overview shows truthful guidance with links to existing workflow stages", async ({ page }) => {
  await openProduction(page);

  const workflow = page.getByRole("region", { name: "Creative workflow" });
  await expect(workflow).toBeVisible();
  await expect(workflow.getByText("Move through each stage as your story is ready. AI can assist; you choose what to accept.")).toBeVisible();

  for (const [label, path] of [
    ["Screenplay", "screenplay"],
    ["Story Bible", "story-bible"],
    ["Characters", "characters"],
    ["Locations", "locations"],
    ["Scenes", "scenes"],
    ["Shot List", "shot-list"],
    ["Storyboard", "storyboard"],
    ["AI Director", "ai-director"],
    ["Assets", "assets"],
    ["Render", "render"],
    ["Export", "export"],
  ]) {
    await expect(workflow.getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "href",
      `/studio/productions/${productionId}/${path}`,
    );
  }

  await expect(page.getByText("Recent Activity", { exact: true })).toHaveCount(0);
  await expect(page.getByText("0%", { exact: true })).toHaveCount(0);
});

test("production overview workflow stays within common viewport widths", async ({ page }) => {
  await openProduction(page);

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("region", { name: "Creative workflow" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("scene form examples use neutral production language", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/productions") ? JSON.stringify(production) : "[]";
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });
  await page.goto(`/studio/productions/${productionId}/scenes`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Add Scene" }).click();
  await page.getByRole("button", { name: "Production", exact: true }).click();

  await expect(page.getByLabel("Scene Heading", { exact: true })).toHaveAttribute(
    "placeholder",
    "INT. LOCATION - DAY",
  );
  await expect(page.getByPlaceholder("List props relevant to this scene...", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Describe established costume details...", { exact: true })).toBeVisible();
});

test("dashboard continue action opens the saved screenplay", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([production]) });
  });
  const productionsLoaded = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith("/productions"));
  await page.goto("/studio", { waitUntil: "domcontentloaded" });
  await productionsLoaded;
  const continueButton = page.getByRole("button", { name: /Continue Story/ });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page).toHaveURL(`/studio/productions/${productionId}/screenplay`);
});

test("studio introduction keeps the filmmaker in creative control", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/studio", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Your creative decisions stay yours;", { exact: false })).toBeVisible();
  await expect(page.getByText(/glorify Christ|communicate biblical truth/i)).toHaveCount(0);
});

test("dashboard AI Director action opens its existing workspace", async ({ page }) => {
  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/studio", { waitUntil: "domcontentloaded" });

  const continueButton = page.getByRole("button", { name: /Continue Story/ });
  await expect(continueButton).toBeDisabled();
  await expect(continueButton).toContainText("Create a production first");
  await expect(page.getByRole("link", { name: "Start with AI Director" })).toHaveAttribute(
    "href",
    "/studio/ai-director",
  );
});
