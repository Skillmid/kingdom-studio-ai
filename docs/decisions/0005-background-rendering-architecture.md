# ADR 0005: Background Video Rendering Worker Architecture

## Status

Implemented locally. The render-job migrations are proposed but have not been applied to any hosted database. A controlled staging integration remains required.

## Context

Video assembly and encoding in Kingdom Studio AI requires concatenating diverse video/audio streams, normalizing resolutions, conforming frame rates, and encoding high-fidelity H.264/AAC MP4 media via FFmpeg.

Rendering complex multi-clip productions is computationally intensive, requiring from several seconds to multiple minutes. Synchronous execution inside standard web request cycles violates cloud provider execution bounds (e.g., Next.js serverless route deadlines of 60s) and risks dropping connections or corrupting partial files.

Furthermore, media output contains sensitive creative intellectual property and biblical storytelling assets; rendered videos must never be stored in public buckets or accessed without verified production ownership.

## Decision

We establish an asynchronous, state-machine-driven background rendering pipeline adhering to the Service and Repository patterns, utilizing local FFmpeg binaries for development and containerized worker services for production.

---

## Architecture Specification

```mermaid
flowchart TD
    Client["Client / Web UI (Studio)"]
    API["API Route (/api/render/jobs)"]
    DB[("Supabase Postgres (video_render_jobs & RLS)")]
    Worker["Video Render Worker Engine"]
    FFmpeg["FFmpeg / FFprobe Encoding Pipeline"]
    Storage[("Private Storage (Supabase Storage: renders)")]

    Client -->|1. Request Render| API
    API -->|2. Verify Ownership & Insert Queued Job| DB
    Worker -->|3. Atomic Claim Job (status: running)| DB
    Worker -->|4. Assemble Media Clips| FFmpeg
    FFmpeg -->|5. Validate Container & Streams| Worker
    Worker -->|6. Stream upload to private storage| Storage
    Worker -->|7. Unlink Local Temp Files| Worker
    Worker -->|8. Mark Job Completed & Record Storage URL| DB
    Client -->|9. Poll Status & Request Presigned Playback URL| API
```

---

### 1. Job Lifecycle & State Machine

A render job progresses through explicit, deterministic lifecycle states:

- **`queued`**: Job initialized with creator-approved sequence clips, target dimensions (e.g., 1080p/720p), framerate (24 fps), and production ownership metadata.
- **`running`**: Claimed atomically by an active worker. `attempts` incremented, `started_at` recorded.
- **`completed`**: File rendered, MP4 container and video stream validated via FFprobe, streamed to private storage, and local scratch files removed.
- **`failed`**: Execution failed with a structured reason. Retryable failures are automatically requeued with backoff until the configured attempt cap; permanent failures remain failed.
- **`cancelled`**: Creator voluntarily aborted the render.

### 2. Atomic Claim & Concurrency Control

The worker calls `claim_video_render_job`, a `SECURITY DEFINER` RPC granted only to `service_role`. It claims one due row under `FOR UPDATE SKIP LOCKED`, increments the attempt count, and assigns a worker ID, unique lease token, and expiry. Heartbeat, progress, completion, failure, and shutdown-release RPCs require the current lease token; stale workers cannot overwrite a newer lease or terminal job.

### 3. Failure Isolation & Retry Strategy

- **Retry Limit:** The API sets 3 attempts; the database caps `max_attempts` at 5.
- **Backoff:** Retryable failures use exponential delay starting at 5 seconds and capped at 15 minutes.
- **Definite vs. Transient Failures:**
  - *Definite (Non-retryable):* Missing source files, invalid aspect ratio parameters, corrupted input media codecs. Job immediately terminates as `failed`.
  - *Transient (Retryable):* Temporary worker IO timeout, transient storage upload drop. Eligible for re-queueing up to attempt cap.
- **Stalled Job Recovery:** Expired leases are recovered transactionally during queue claims. They are requeued with backoff unless cancelled or the attempt limit is exhausted.

### 4. Storage & Access Control Architecture

- **Private Storage Isolation:**
  Rendered output is saved into a private Supabase Storage bucket (`renders`), partitioned strictly by production ID:
  `productions/{productionId}/renders/{jobId}/{leaseToken}.mp4`
- **Output Access Control:**
  Direct public URLs are strictly forbidden. Access is authorized via:
  1. Server-side production ownership verification (`auth.uid() = productions.owner_id`).
  2. Short-lived signed URLs (5 minutes) generated only after API ownership verification. Local file playback uses a process-bound HMAC capability and streams the file instead of buffering the MP4 into a browser Blob.

### 5. Disk Cleanup & Local Resource Hygiene

- All rendering operations take place in job- and lease-specific disposable scratch directories.
- Once the assembled MP4 is validated and uploaded to private storage, `cleanupLocalFileAfterUpload: true` triggers immediate deletion (`unlink()`) of the local assembled video and intermediate concat lists.
- Temporary files never persist across completed jobs.

---

## Deployment Strategy

1. The standalone worker entrypoint is `src/features/render/services/render-worker-entrypoint.ts`; run it with `npm run render:worker`.
2. Media URLs are HTTPS-only, DNS answers are validated and pinned to a public IP, redirects are revalidated, and downloads have size and wall-clock limits.
3. FFmpeg receives downloaded media through `pipe:0` with only the `pipe` protocol enabled for untrusted inputs; remote URLs and arbitrary local paths are not passed to it.
4. Worker concurrency, per-job duration, RSS, free disk, input size, FFmpeg and FFprobe paths are configurable and bounded. `/health/live` and `/health/ready` are provided.
5. No hosted migration, worker deployment, paid infrastructure, or live storage has been exercised. Follow the staging-only sequence in `docs/05-SUPABASE-MIGRATION-RUNBOOK.md` after the staging project and backups are explicitly authorized.
