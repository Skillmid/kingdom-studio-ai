import { expect, test } from "@playwright/test";

test("studio assets and profile stay on local services without failed requests", async ({ context }) => {
  for (const [path, content] of [
    ["/studio/assets", "Global Assets"],
    ["/studio/profile", "My Profile"],
  ] as const) {
    const page = await context.newPage();
    const nonLocalRequests: string[] = [];
    const failedRequests: { url: string; error: string }[] = [];
    const failedResponses: string[] = [];

    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1"
      ) {
        nonLocalRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? "unknown error",
      });
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(content);
    expect(nonLocalRequests).toEqual([]);
    const unexpectedFailedRequests = failedRequests.filter(({ url, error }) => {
      const requestUrl = new URL(url);
      return !(
        error === "net::ERR_ABORTED" &&
        requestUrl.hostname === "localhost" &&
        requestUrl.port === "3000" &&
        requestUrl.searchParams.has("_rsc")
      );
    });
    expect(unexpectedFailedRequests).toEqual([]);
    expect(failedResponses).toEqual([]);
    await page.close();
  }
});
