import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    headless: true,
  },
});
