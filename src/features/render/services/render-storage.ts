import { createReadStream } from "node:fs";
import { copyFile, mkdir, stat, unlink } from "node:fs/promises";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RenderStorageUploadResult {
  storageKey: string;
  storageUrl: string;
}

export interface SignedPlaybackUrlResult {
  signedUrl: string;
  expiresAt: string;
}

export interface RenderStorageAdapter {
  upload(localFilePath: string, storageKey: string, contentType?: string): Promise<RenderStorageUploadResult>;
  createSignedPlaybackUrl(storageKey: string, expiresInSeconds?: number): Promise<SignedPlaybackUrlResult>;
  verifyAccess(userId: string, productionOwnerId: string): boolean;
  delete(storageKey: string): Promise<void>;
}

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600; // 1 hour
const globalWithPlaybackSecret = globalThis as typeof globalThis & {
  __kingdomRenderPlaybackSecret?: Buffer;
};
const LOCAL_STORAGE_SIGNING_SECRET = process.env["RENDER_LOCAL_PLAYBACK_SECRET"]
  ? Buffer.from(process.env["RENDER_LOCAL_PLAYBACK_SECRET"], "utf8")
  : globalWithPlaybackSecret.__kingdomRenderPlaybackSecret
    ?? (globalWithPlaybackSecret.__kingdomRenderPlaybackSecret = randomBytes(32));
const MAX_RENDER_FILE_BYTES = 256 * 1024 * 1024;
const LOCAL_STORAGE_ROOT = resolve(
  /*turbopackIgnore: true*/ process.env["RENDER_LOCAL_STORAGE_DIRECTORY"]
    ?? join(tmpdir(), "kingdom-studio-ai", "storage"),
);

function resolveLocalStoragePath(storageKey: string): string {
  validateStorageKey(storageKey);
  const filePath = resolve(/*turbopackIgnore: true*/ LOCAL_STORAGE_ROOT, storageKey);
  if (!filePath.startsWith(`${LOCAL_STORAGE_ROOT}${sep}`)) {
    throw new Error("Invalid render storage key.");
  }
  return filePath;
}

function validateStorageKey(storageKey: string): void {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  if (!new RegExp(`^productions/${uuid}/renders/${uuid}/${uuid}\\.mp4$`, "i").test(storageKey)) {
    throw new Error("Invalid production-scoped render storage key.");
  }
}

function validatePlaybackTtl(expiresInSeconds: number): void {
  if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 3600) {
    throw new Error("Render playback URLs must expire within one hour.");
  }
}

function signLocalPlayback(storageKey: string, expiresAt: string): string {
  return createHmac("sha256", LOCAL_STORAGE_SIGNING_SECRET)
    .update(`${storageKey}:${expiresAt}`)
    .digest("hex");
}

export function verifyLocalPlaybackGrant(
  jobId: string,
  storageKey: string,
  expiresAt: string,
  signature: string,
): boolean {
  try {
    validateStorageKey(storageKey);
    const keyJobId = storageKey.split("/")[3];
    const expiry = Date.parse(expiresAt);
    if (
      keyJobId !== jobId
      || !Number.isFinite(expiry)
      || expiry <= Date.now()
      || expiry > Date.now() + 60 * 60 * 1000
      || !/^[0-9a-f]{64}$/i.test(signature)
    ) return false;
    return timingSafeEqual(
      Buffer.from(signLocalPlayback(storageKey, expiresAt), "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

export function isLocalSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * LocalMockRenderStorageAdapter for safe offline, deterministic development and tests.
 * Generates valid signed URLs with timestamp expiration and owner validation.
 */
export class LocalMockRenderStorageAdapter implements RenderStorageAdapter {
  private readonly storedFiles = new Map<string, { path: string; contentType: string }>();

  async upload(localFilePath: string, storageKey: string, contentType: string = "video/mp4"): Promise<RenderStorageUploadResult> {
    this.storedFiles.set(storageKey, { path: localFilePath, contentType });
    const storageUrl = `storage://${storageKey}`;
    return { storageKey, storageUrl };
  }

  async createSignedPlaybackUrl(
    storageKey: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS
  ): Promise<SignedPlaybackUrlResult> {
    validatePlaybackTtl(expiresInSeconds);
    validateStorageKey(storageKey);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    const signature = signLocalPlayback(storageKey, expiresAt);
    const signedUrl = `local:///playback?key=${encodeURIComponent(storageKey)}&expires=${encodeURIComponent(expiresAt)}&sig=${signature}`;
    return { signedUrl, expiresAt };
  }

  verifyAccess(userId: string, productionOwnerId: string): boolean {
    if (!userId || !productionOwnerId) return false;
    return userId === productionOwnerId;
  }

  async delete(storageKey: string): Promise<void> {
    this.storedFiles.delete(storageKey);
  }

  isUploaded(storageKey: string): boolean {
    return this.storedFiles.has(storageKey);
  }
}

export class LocalFileRenderStorageAdapter implements RenderStorageAdapter {
  async upload(localFilePath: string, storageKey: string): Promise<RenderStorageUploadResult> {
    const file = await stat(localFilePath);
    if (file.size > MAX_RENDER_FILE_BYTES) {
      throw new Error(`Rendered video exceeds the ${MAX_RENDER_FILE_BYTES}-byte local storage limit.`);
    }
    const destination = resolveLocalStoragePath(storageKey);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(localFilePath, destination);
    return { storageKey, storageUrl: `local://${storageKey}` };
  }

  async createSignedPlaybackUrl(
    storageKey: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
  ): Promise<SignedPlaybackUrlResult> {
    validatePlaybackTtl(expiresInSeconds);
    validateStorageKey(storageKey);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    const signature = signLocalPlayback(storageKey, expiresAt);
    return {
      signedUrl: `local:///playback?key=${encodeURIComponent(storageKey)}&expires=${encodeURIComponent(expiresAt)}&sig=${signature}`,
      expiresAt,
    };
  }

  verifyAccess(userId: string, productionOwnerId: string): boolean {
    return Boolean(userId && productionOwnerId && userId === productionOwnerId);
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(resolveLocalStoragePath(storageKey));
  }

  getFilePath(storageKey: string): string {
    return resolveLocalStoragePath(storageKey);
  }
}

/**
 * SupabaseRenderStorageAdapter connects to private Supabase Storage buckets.
 */
export class SupabaseRenderStorageAdapter implements RenderStorageAdapter {
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor(supabase: SupabaseClient, bucketName: string = "renders") {
    this.supabase = supabase;
    this.bucketName = bucketName;
  }

  async upload(
    localFilePath: string,
    storageKey: string,
    contentType: string = "video/mp4"
  ): Promise<RenderStorageUploadResult> {
    validateStorageKey(storageKey);
    const file = await stat(localFilePath);
    if (file.size > MAX_RENDER_FILE_BYTES) {
      throw new Error(`Rendered video exceeds the ${MAX_RENDER_FILE_BYTES}-byte storage limit.`);
    }
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(storageKey, createReadStream(localFilePath), {
        contentType,
        upsert: false,
        duplex: "half",
      });

    if (error) {
      throw new Error(`Failed to upload rendered video to Supabase Storage: ${error.message}`);
    }

    return {
      storageKey: data.path,
      storageUrl: `storage://${data.path}`,
    };
  }

  async createSignedPlaybackUrl(
    storageKey: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS
  ): Promise<SignedPlaybackUrlResult> {
    validatePlaybackTtl(expiresInSeconds);
    validateStorageKey(storageKey);
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(storageKey, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to create signed playback URL: ${error?.message ?? "Unknown error"}`);
    }

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    return {
      signedUrl: data.signedUrl,
      expiresAt,
    };
  }

  verifyAccess(userId: string, productionOwnerId: string): boolean {
    if (!userId || !productionOwnerId) return false;
    return userId === productionOwnerId;
  }

  async delete(storageKey: string): Promise<void> {
    validateStorageKey(storageKey);
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([storageKey]);

    if (error) {
      throw new Error(`Failed to delete storage file '${storageKey}': ${error.message}`);
    }
  }
}

export function createRenderStorageAdapter(
  supabase: SupabaseClient,
  supabaseUrl: string | undefined,
): RenderStorageAdapter {
  return isLocalSupabaseUrl(supabaseUrl)
    ? new LocalFileRenderStorageAdapter()
    : new SupabaseRenderStorageAdapter(supabase);
}
