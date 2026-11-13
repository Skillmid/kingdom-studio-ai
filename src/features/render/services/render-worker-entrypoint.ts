import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir, cpus, totalmem } from "node:os";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { startDurableRenderWorker } from "./durable-render-worker";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd());

function positiveInteger(name: string, fallback: number, maximum = Number.MAX_SAFE_INTEGER): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${name} must be a positive integer no greater than ${maximum}.`);
  }
  return value;
}

async function getMemoryLimitBytes(): Promise<number> {
  for (const path of ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"]) {
    try {
      const value = (await readFile(path, "utf8")).trim();
      if (value === "max") continue;
      const limit = Number(value);
      if (Number.isSafeInteger(limit) && limit > 0) return Math.min(totalmem(), limit);
    } catch {
      continue;
    }
  }
  return totalmem();
}

async function main(): Promise<void> {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Render worker requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const concurrency = positiveInteger("RENDER_WORKER_CONCURRENCY", 1, Math.min(4, cpus().length));
  const maxJobDurationMs = positiveInteger("RENDER_WORKER_MAX_JOB_DURATION_MS", 300_000, 1_800_000);
  const healthPort = positiveInteger("RENDER_WORKER_HEALTH_PORT", 8080, 65535);
  const scratchDirectory = resolve(
    process.env["RENDER_WORKER_SCRATCH_DIRECTORY"] ?? join(tmpdir(), "kingdom-studio-ai", "render-worker"),
  );
  await mkdir(scratchDirectory, { recursive: true });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const worker = startDurableRenderWorker({
    supabase,
    supabaseUrl,
    scratchDirectory,
    concurrency,
    pollIntervalMs: positiveInteger("RENDER_WORKER_POLL_INTERVAL_MS", 1_000),
    maxInputBytes: positiveInteger("RENDER_WORKER_MAX_INPUT_BYTES", 512 * 1024 * 1024),
    minFreeDiskBytes: positiveInteger("RENDER_WORKER_MIN_FREE_DISK_BYTES", 1024 * 1024 * 1024),
    maxMemoryBytes: positiveInteger("RENDER_WORKER_MAX_MEMORY_BYTES", Math.floor((await getMemoryLimitBytes()) * 0.75)),
    maxJobDurationMs,
    ffmpegPath: process.env["FFMPEG_PATH"] ?? "ffmpeg",
    ffprobePath: process.env["FFPROBE_PATH"] ?? "ffprobe",
  });

  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path === "/health/live") {
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ status: "live" }));
      return;
    }
    if (path === "/health/ready") {
      void worker.isReady().then((ready) => {
        response.writeHead(ready ? 200 : 503, {
          "content-type": "application/json",
          "cache-control": "no-store",
        });
        response.end(JSON.stringify({
          status: ready ? "ready" : "not-ready",
          activeJobs: worker.activeJobCount(),
        }));
      }).catch((error: unknown) => {
        response.writeHead(503, { "content-type": "application/json", "cache-control": "no-store" });
        response.end(JSON.stringify({ status: "not-ready", error: error instanceof Error ? error.message : String(error) }));
      });
      return;
    }
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not found." }));
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(healthPort, "0.0.0.0", () => {
      server.removeListener("error", rejectListen);
      resolveListen();
    });
  });

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", service: "render-worker", event: "shutdown_started", signal }));
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
    await worker.close();
  };

  process.once("SIGINT", () => void shutdown("SIGINT").then(() => process.exit(0)));
  process.once("SIGTERM", () => void shutdown("SIGTERM").then(() => process.exit(0)));
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    service: "render-worker",
    event: "health_server_listening",
    port: healthPort,
    concurrency,
    scratchDirectory,
  }));
}

void main().catch((error: unknown) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    service: "render-worker",
    event: "startup_failed",
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exitCode = 1;
});
