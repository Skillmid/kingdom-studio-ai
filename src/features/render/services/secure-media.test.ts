import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import type { IncomingHttpHeaders } from "node:http";
import test from "node:test";

import { downloadSecureMedia, isPublicIpAddress, validatePublicMediaUrl } from "./secure-media";

function response(
  statusCode: number,
  headers: IncomingHttpHeaders,
  body = "",
): PassThrough & { statusCode: number; headers: IncomingHttpHeaders } {
  const stream = Object.assign(new PassThrough(), { statusCode, headers });
  stream.end(body);
  return stream;
}

test("render media network security", async (t) => {
  await t.test("blocks private, loopback, link-local, reserved, and mapped IPv6 addresses", () => {
    for (const address of [
      "0.0.0.0",
      "10.1.2.3",
      "127.0.0.1",
      "169.254.1.2",
      "172.20.1.1",
      "192.168.1.2",
      "224.0.0.1",
      "240.0.0.1",
      "::",
      "::1",
      "::ffff:127.0.0.1",
      "fc00::1",
      "fe80::1",
      "2001:db8::1",
    ]) {
      assert.equal(isPublicIpAddress(address), false, `${address} must be blocked`);
    }

    assert.equal(isPublicIpAddress("8.8.8.8"), true);
    assert.equal(isPublicIpAddress("2606:4700:4700::1111"), true);
  });

  await t.test("rejects a DNS answer containing any private address before making a request", async () => {
    let requestCount = 0;

    await assert.rejects(
      downloadSecureMedia("https://media.example/video.mp4", join(tmpdir(), "blocked-video.mp4"), {
        resolveHost: async () => [
          { address: "8.8.8.8", family: 4 },
          { address: "127.0.0.1", family: 4 },
        ],
        request: async () => {
          requestCount += 1;
          return response(200, { "content-type": "video/mp4" }, "content");
        },
      }),
      /private or reserved network address/,
    );
    assert.equal(requestCount, 0);
  });

  await t.test("revalidates and pins a public redirect destination", async () => {
    const directory = await mkdtemp(join(tmpdir(), "kingdom-secure-media-"));
    const destination = join(directory, "video.mp4");
    const resolvedHosts: string[] = [];
    const requested: Array<{ host: string; address: string; family: number }> = [];
    const publicAddresses: Record<string, { address: string; family: number }> = {
      "media.example": { address: "8.8.8.8", family: 4 },
      "cdn.example": { address: "1.1.1.1", family: 4 },
    };

    try {
      const downloaded = await downloadSecureMedia("https://media.example/video.mp4", destination, {
        resolveHost: async (hostname) => {
          resolvedHosts.push(hostname);
          const record = publicAddresses[hostname];
          return record ? [record] : [];
        },
        request: async (url, address, family) => {
          requested.push({ host: url.hostname, address, family });
          if (url.hostname === "media.example") {
            return response(302, { location: "https://cdn.example/video.mp4" });
          }
          return response(200, { "content-type": "video/mp4", "content-length": "8" }, "fake mp4");
        },
      });

      assert.deepEqual(resolvedHosts, ["media.example", "cdn.example"]);
      assert.deepEqual(requested, [
        { host: "media.example", address: "8.8.8.8", family: 4 },
        { host: "cdn.example", address: "1.1.1.1", family: 4 },
      ]);
      assert.equal(downloaded.bytes, 8);
      assert.equal(await readFile(destination, "utf8"), "fake mp4");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  await t.test("blocks a redirect to a private DNS destination without following it", async () => {
    let requestCount = 0;
    const resolvedHosts: string[] = [];
    const directory = await mkdtemp(join(tmpdir(), "kingdom-secure-media-"));

    try {
      await assert.rejects(
        downloadSecureMedia("https://media.example/video.mp4", join(directory, "video.mp4"), {
          resolveHost: async (hostname) => {
            resolvedHosts.push(hostname);
            return hostname === "media.example"
              ? [{ address: "8.8.8.8", family: 4 }]
              : [{ address: "10.0.0.1", family: 4 }];
          },
          request: async () => {
            requestCount += 1;
            return response(302, { location: "https://internal.example/video.mp4" });
          },
        }),
        /private or reserved network address/,
      );

      assert.deepEqual(resolvedHosts, ["media.example", "internal.example"]);
      assert.equal(requestCount, 1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  await t.test("rejects non-HTTPS media URLs before DNS resolution", async () => {
    let resolverCalled = false;
    await assert.rejects(
      validatePublicMediaUrl("http://media.example/video.mp4", async () => {
        resolverCalled = true;
        return [{ address: "8.8.8.8", family: 4 }];
      }),
      /must use HTTPS/,
    );
    assert.equal(resolverCalled, false);
  });
});
