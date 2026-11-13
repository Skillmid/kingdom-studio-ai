import { defineConfig } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  reporter: "list",
  globalSetup: "./e2e/global-setup.mjs",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    headless: true,
    storageState: "test-results/e2e-auth-state.json",
    navigationTimeout: 60_000,
  },
  webServer: [
    {
      command: "node e2e/support/mock-supabase.mjs",
      url: "http://127.0.0.1:54321/health",
      timeout: 30_000,
      reuseExistingServer: false,
      env: {
        E2E_RENDER_WORKER_KEY: "e2e-render-worker-test-service-role-key",
      },
    },
    {
      command: "npm run render:worker",
      url: "http://127.0.0.1:54322/health/ready",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_SERVICE_ROLE_KEY: "e2e-render-worker-test-service-role-key",
        E2E_RENDER_WORKER_KEY: "e2e-render-worker-test-service-role-key",
        RENDER_WORKER_HEALTH_PORT: "54322",
        RENDER_WORKER_MIN_FREE_DISK_BYTES: "1",
        RENDER_WORKER_SCRATCH_DIRECTORY: join(tmpdir(), "kingdom-studio-ai-playwright-render-worker"),
        RENDER_LOCAL_STORAGE_DIRECTORY: join(tmpdir(), "kingdom-studio-ai-playwright-render-storage"),
        FFPROBE_PATH: process.env["FFPROBE_PATH"] ?? join(process.env["LOCALAPPDATA"] ?? "", "Microsoft", "WinGet", "Links", "ffprobe.exe"),
      },
    },
    {
      command: "npm run build && npm run start -- --hostname 127.0.0.1",
      url: "http://127.0.0.1:3000",
      timeout: 900_000,
      reuseExistingServer: false,
      env: {
        SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_PUBLISHABLE_KEY: "e2e-only-publishable-key",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "e2e-only-publishable-key",
        RENDER_LOCAL_STORAGE_DIRECTORY: join(tmpdir(), "kingdom-studio-ai-playwright-render-storage"),
      },
    },
  ],
});
