/**
 * Maps a production aspect ratio (e.g. "16:9", "2.39:1", "9:16") to the closest
 * value each provider actually accepts. Pure and provider-agnostic so the
 * mapping is documented and testable in one place.
 *
 * Provider capabilities (documented provider API values; not executed here):
 * - Kling text2video: 16:9, 9:16, 1:1
 * - Kling image generations: 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9
 *   (21:9 is not available on kling-v1, the default image model)
 * - OpenAI dall-e-3: 1024x1024, 1792x1024, 1024x1792
 * - OpenAI dall-e-2: square sizes only (1024x1024 used)
 * - OpenAI gpt-image-*: 1024x1024, 1536x1024, 1024x1536 (inline data only; see openai-image.provider)
 */

export const DEFAULT_GENERATION_ASPECT_RATIO = "16:9";

export const KLING_VIDEO_ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
export const KLING_IMAGE_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3", "21:9"] as const;
const KLING_V1_IMAGE_ASPECT_RATIOS = KLING_IMAGE_ASPECT_RATIOS.filter((ratio) => ratio !== "21:9");

export function parseAspectRatio(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)$/i);
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return undefined;
  return width / height;
}

/** Picks the supported ratio whose numeric value is closest (in log space) to the requested one. */
export function closestAspectRatio(requested: unknown, supported: readonly string[], fallback = DEFAULT_GENERATION_ASPECT_RATIO): string {
  const target = parseAspectRatio(requested);
  if (target === undefined) return supported.includes(fallback) ? fallback : supported[0] ?? fallback;
  let best = supported[0] ?? fallback;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of supported) {
    const value = parseAspectRatio(candidate);
    if (value === undefined) continue;
    const distance = Math.abs(Math.log(value) - Math.log(target));
    // Strictly better by a margin, so exact ties keep the earlier (preferred) candidate.
    if (distance < bestDistance - 1e-9) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export function klingAspectRatio(requested: unknown, jobType: "image" | "video", model?: string): string {
  if (jobType === "video") return closestAspectRatio(requested, KLING_VIDEO_ASPECT_RATIOS);
  const supported = !model || model === "kling-v1" ? KLING_V1_IMAGE_ASPECT_RATIOS : KLING_IMAGE_ASPECT_RATIOS;
  return closestAspectRatio(requested, supported);
}

export function openAIImageSize(requested: unknown, model: string): string {
  const ratio = parseAspectRatio(requested) ?? parseAspectRatio(DEFAULT_GENERATION_ASPECT_RATIO)!;
  const orientation = ratio > 1.15 ? "landscape" : ratio < 0.87 ? "portrait" : "square";
  if (/^dall-e-2/i.test(model)) return "1024x1024";
  if (/^dall-e-3/i.test(model)) {
    return orientation === "landscape" ? "1792x1024" : orientation === "portrait" ? "1024x1792" : "1024x1024";
  }
  return orientation === "landscape" ? "1536x1024" : orientation === "portrait" ? "1024x1536" : "1024x1024";
}
