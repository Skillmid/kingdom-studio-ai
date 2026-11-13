# ADR 0006: Video Render Worker Production Deployment Plan

## Status

Local worker entrypoint and lease processing implemented. Container deployment, staging migrations, and hosted storage/authentication remain unverified; no paid infrastructure is provisioned.

## Context

Video encoding via FFmpeg requires significant CPU/memory resources and dedicated system binaries that cannot execute reliably inside serverless request cycles (such as Vercel Next.js edge/serverless routes with 60s execution caps).

To ensure stability, predictable compute scaling, and isolation of high-load encoding from web traffic, a containerized worker architecture is specified for production deployment.

---

## 1. Container Specification & Dockerfile

The worker container packages Node.js 22, system FFmpeg/FFprobe binaries, and the Kingdom Studio AI render worker runtime.

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:22-bookworm-slim AS base

# Install system dependencies & statically linked FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ensure non-root execution
RUN groupadd -g 10001 kingdom && \
    useradd -u 10001 -g kingdom -s /bin/bash -m kingdom

FROM base AS dependencies
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS builder
COPY package*.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe
ENV RENDER_WORKER_SCRATCH_DIRECTORY=/tmp/renders

# Create scratch directory for disposable encoding
RUN mkdir -p /tmp/renders && chown -R kingdom:kingdom /tmp/renders

USER kingdom
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts/ts-test-loader.mjs ./scripts/ts-test-loader.mjs

EXPOSE 8080

CMD ["npm", "run", "render:worker"]
```

---

## 2. Environment Variables & Secret Management

| Variable Name | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | Set to `production`. |
| `SUPABASE_URL` | Yes | Target Supabase project API URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Worker service role credential (stored in Google Secret Manager / AWS Secrets Manager). Never exposed to browser. |
| `FFMPEG_PATH` | Yes | Path to FFmpeg executable (`/usr/bin/ffmpeg`). |
| `FFPROBE_PATH` | Yes | Path to FFprobe executable (`/usr/bin/ffprobe`). |
| `RENDER_WORKER_HEALTH_PORT` | No | Health check port (default: `8080`). |
| `RENDER_WORKER_CONCURRENCY` | No | Concurrent jobs per replica (default: `1`; capped at 4 and CPU count). |
| `RENDER_WORKER_POLL_INTERVAL_MS` | No | Queue polling interval (default: `1000` ms). |
| `RENDER_WORKER_SCRATCH_DIRECTORY` | No | Worker scratch root. Use an ephemeral, capacity-limited disk. |
| `RENDER_WORKER_MAX_MEMORY_BYTES` | No | RSS ceiling; defaults to 75% of detected cgroup/host memory. |
| `RENDER_WORKER_MIN_FREE_DISK_BYTES` | No | Required free space before work (default: 1 GiB). |
| `RENDER_WORKER_MAX_INPUT_BYTES` | No | Aggregate source-download limit (default: 512 MiB). |
| `RENDER_WORKER_MAX_JOB_DURATION_MS` | No | Wall-clock limit per job (default: 5 min; maximum: 30 min). |

---

## 3. Compute Resource Allocation & Scaling Limits

| Resource Dimension | Minimum (Dev/Staging) | Production Standard (1080p) | High-Fidelity (4K / VFX) |
|---|---|---|---|
| **vCPU** | 1.0 vCPU | 2.0 – 4.0 vCPU | 8.0 vCPU |
| **Memory (RAM)** | 2 GiB | 4 GiB – 8 GiB | 16 GiB |
| **Ephemeral Disk** | 10 GiB | 30 GiB | 100 GiB |
| **Max Job Timeout** | 300s (5m) | 600s (10m) | 1800s (30m) |
| **Autoscaling Target** | 0 – 1 instances | 0 – 10 instances (scale to zero when idle) | Dedicated pool |

---

## 4. Health Checks & Process Lifecycle

The container exposes lightweight HTTP endpoints on port 8080:

- **Liveness Probe (`GET /health/live`):**
  - Returns HTTP 200 `{ status: "ok" }` if the Node.js event loop is unblocked.
  - Failure threshold: 3 checks over 30 seconds triggers container replacement.
- **Readiness Probe (`GET /health/ready`):**
  - Confirms:
    1. Database connectivity to Supabase.
    2. FFmpeg executable is present and executable (`ffmpeg -version` check).
    3. Private `renders` bucket accessibility for hosted Supabase (local mode uses private local file storage).
  - Failure removes container from the routing pool.

---

## 5. Structured Observability & Telemetry

All worker logs emit standardized single-line JSON to `stdout`:
```json
{
  "timestamp": "2026-10-19T11:45:00.000Z",
  "level": "info",
  "service": "render-worker",
  "jobId": "28fffdf3-a12c-414f-8089-e7bbf03f0c57",
  "productionId": "11111111-1111-4111-8111-111111111111",
  "event": "job_completed",
  "durationMs": 4820,
  "outputBytes": 14251,
  "attempt": 1
}
```

---

## 6. Execution & Deployment Roadmap

1. **Local verification:** Unit tests use mocks; Playwright uses a local mock Supabase server, local FFmpeg/FFprobe, and local file storage. These are not hosted integration tests.
2. **Staging database:** Review migration history, take and verify a staging backup, apply both render migrations to staging only, then verify table grants, RLS, RPCs, and service-role worker claims.
3. **Staging worker:** Build a non-root container, supply service-role credentials only through a secret manager, restrict outbound network access, set CPU/memory/disk limits, and verify health, retries, cancellation, and private signed playback.
4. **Controlled release:** Obtain explicit approval before applying migrations or deploying. No production migration/deployment is authorized by this document.
