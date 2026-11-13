import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import testAuth from "./support/test-auth.cjs";

const { createAuthCookie, testForeignUserId, testProductionId } = testAuth;
const ownerId = "22222222-2222-4222-8222-222222222222";
const readySequenceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const failingSequenceId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const localStorageRoot = join(tmpdir(), "kingdom-studio-ai-playwright-render-storage");

test.setTimeout(180_000);

const production = {
  id: testProductionId,
  owner_id: ownerId,
  created_by: ownerId,
  title: "Render Workflow Test",
  slug: "render-workflow-test",
  logline: null,
  synopsis: null,
  genre: null,
  target_audience: null,
  art_style: null,
  language: "English",
  aspect_ratio: "16:9",
  target_duration_seconds: 90,
  cover_image_url: null,
  status: "concept",
  visibility: "private",
  created_at: "2026-10-09T00:00:00.000Z",
  updated_at: "2026-10-09T00:00:00.000Z",
  last_opened_at: null,
  deleted_at: null,
};

const sequences = [
  {
    id: readySequenceId,
    production_id: testProductionId,
    title: "Two-clip local render",
    status: "ready",
    progress: 100,
    item_count: 2,
    ready_item_count: 2,
    missing_media_count: 0,
    total_duration_seconds: 2,
    uncertainty_notes: null,
    source_evidence: "Local render integration fixture",
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-09T00:00:00.000Z",
    updated_at: "2026-10-09T00:00:00.000Z",
  },
  {
    id: failingSequenceId,
    production_id: testProductionId,
    title: "Failing render fixture",
    status: "ready",
    progress: 100,
    item_count: 1,
    ready_item_count: 1,
    missing_media_count: 0,
    total_duration_seconds: 1,
    uncertainty_notes: null,
    source_evidence: "Local failure integration fixture",
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-08T00:00:00.000Z",
    updated_at: "2026-10-08T00:00:00.000Z",
  },
];

const clips = [
  ...[1, 2].map((sequenceNumber) => ({
    id: `cccccccc-cccc-4ccc-8ccc-${String(sequenceNumber).padStart(12, "0")}`,
    production_id: testProductionId,
    render_id: readySequenceId,
    sequence_number: sequenceNumber,
    scene_id: null,
    shot_id: null,
    panel_id: null,
    asset_id: null,
    title: `Approved test clip ${sequenceNumber}`,
    description: "Synthetic color slate for local ffmpeg integration testing.",
    media_url: null,
    duration_seconds: 1,
    source_kind: "scene",
    source_id: null,
    source_evidence: null,
    uncertainty_notes: null,
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-09T00:00:00.000Z",
    updated_at: "2026-10-09T00:00:00.000Z",
  })),
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    production_id: testProductionId,
    render_id: failingSequenceId,
    sequence_number: 1,
    scene_id: null,
    shot_id: null,
    panel_id: null,
    asset_id: null,
    title: "Unavailable local media",
    description: "Deliberately unavailable source for failure-state testing.",
    media_url: "https://127.0.0.1:1/unavailable.mp4",
    duration_seconds: 1,
    source_kind: "scene",
    source_id: null,
    source_evidence: null,
    uncertainty_notes: null,
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-08T00:00:00.000Z",
    updated_at: "2026-10-08T00:00:00.000Z",
  },
];

function requestState(cookie: { name: string; value: string } | null) {
  return {
    cookies: cookie ? [{
      ...cookie,
      domain: "localhost",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    }] : [],
    origins: [],
  };
}

async function stubRenderSources(page: import("@playwright/test").Page) {
  await page.route("**/rest/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.slice("/rest/v1/".length);
    const records = table === "productions"
      ? [production]
      : table === "render_sequences"
        ? sequences
        : table === "render_clips"
          ? clips
          : [];
    const response = records.filter((record) =>
      [...url.searchParams].every(([key, filter]) =>
        key === "select" || key === "order" || !filter.startsWith("eq.")
        || String(record[key as keyof typeof record] ?? "") === filter.slice(3),
      ),
    );
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
  });
}

test("owner renders multiple clips, validates the MP4, and plays it through authorized local playback", async ({ page }) => {
  await stubRenderSources(page);
  await page.goto(`/studio/productions/${testProductionId}/render`);
  await expect(page.getByRole("heading", { name: "Render assembly" })).toBeVisible();
  await expect(page.getByText("Approved test clip 1")).toBeVisible();
  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/render/jobs") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Submit MP4 render" }).click();
  const created = await (await createResponse).json() as { job: { id: string } };

  const job = page.locator(`[aria-label="Render job ${created.job.id}"]`);
  await expect(job).toContainText("completed", { timeout: 120_000 });
  await expect(job.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("button", { name: "Play render" }).click();
  const video = page.locator("video");
  await expect(video).toBeVisible();

  const base64 = await video.evaluate(async (element) => {
    const player = element as HTMLVideoElement;
    const response = await fetch(player.currentSrc);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  });
  const tempDirectory = await mkdtemp(join(tmpdir(), "kingdom-render-e2e-"));
  const mp4Path = join(tempDirectory, "two-clips.mp4");
  try {
    await writeFile(mp4Path, Buffer.from(base64, "base64"));
    const probePath = process.env["FFPROBE_PATH"]
      ?? join(process.env["LOCALAPPDATA"] ?? "", "Microsoft", "WinGet", "Links", "ffprobe.exe");
    expect(existsSync(probePath), "ffprobe must be installed to validate encoded media").toBe(true);
    const probe = JSON.parse(execFileSync(probePath, [
      "-v", "error", "-show_entries", "format=format_name,duration", "-of", "json", mp4Path,
    ], { encoding: "utf8" })) as { format: { format_name: string; duration: string } };
    expect(probe.format.format_name).toContain("mp4");
    expect(Number(probe.format.duration)).toBeGreaterThan(1.5);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
    const storageDirectory = join(localStorageRoot, "productions", testProductionId, "renders", created.job.id);
    await rm(storageDirectory, { recursive: true, force: true });
  }
});

test("render UI reports unsafe source media as a permanent failure", async ({ page }) => {
  await stubRenderSources(page);
  await page.goto(`/studio/productions/${testProductionId}/render`);
  await page.getByLabel("Saved sequence").selectOption(failingSequenceId);
  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/render/jobs") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Submit MP4 render" }).click();
  const created = await (await createResponse).json() as { job: { id: string } };

  const job = page.locator(`[aria-label="Render job ${created.job.id}"]`);
  await expect(job).toContainText("failed", { timeout: 120_000 });
  await expect(job.getByRole("alert")).toContainText(/source_url_invalid/i);
  await expect(job.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("render job API rejects unauthenticated and foreign production access", async ({ playwright }) => {
  const unauthenticated = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: { cookies: [], origins: [] },
  });
  try {
    const response = await unauthenticated.get(`/api/render/jobs?productionId=${testProductionId}`);
    expect(response.status()).toBe(401);
  } finally {
    await unauthenticated.dispose();
  }

  const foreign = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: requestState(createAuthCookie(testForeignUserId)),
  });
  try {
    const response = await foreign.get(`/api/render/jobs?productionId=${testProductionId}`);
    expect([403, 404]).toContain(response.status());
  } finally {
    await foreign.dispose();
  }
});
