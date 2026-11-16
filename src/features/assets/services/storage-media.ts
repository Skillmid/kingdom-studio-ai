import type { SupabaseClient } from "@supabase/supabase-js";

import type { Asset } from "../types/asset";

export const DEFAULT_PRODUCTION_MEDIA_BUCKET = "production-media";
export const SIGNED_MEDIA_URL_TTL_SECONDS = 60 * 60 * 24;

export function parseStorageReference(reference: string): { bucket: string; path: string } | null {
  const match = reference.match(/^storage:\/\/([a-z0-9_-]+)\/(.+)$/i);
  return match ? { bucket: match[1], path: match[2] } : null;
}

export async function signedStorageUrl(
  client: SupabaseClient,
  bucket: string,
  path: string,
): Promise<string> {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_MEDIA_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Unable to create a secure preview URL for this production image.");
  }
  return data.signedUrl;
}

export async function hydrateAssetMedia(asset: Asset, client: SupabaseClient): Promise<Asset> {
  if (!asset.storagePath) return asset;
  return {
    ...asset,
    fileUrl: await signedStorageUrl(client, DEFAULT_PRODUCTION_MEDIA_BUCKET, asset.storagePath),
  };
}
