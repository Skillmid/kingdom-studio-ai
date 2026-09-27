const HTTP_URL = /^https?:\/\/[^\s]+$/i;

export function extractProviderUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  if (!HTTP_URL.test(url)) return undefined;
  return url;
}

export function firstProviderUrl(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const url = extractProviderUrl(item) ?? extractProviderUrl(isRecord(item) ? item.url : undefined);
        if (url) return url;
      }
      continue;
    }
    if (isRecord(candidate)) {
      const url = firstProviderUrl(candidate.url, candidate.video_url, candidate.image_url, candidate.uri);
      if (url) return url;
      continue;
    }
    const url = extractProviderUrl(candidate);
    if (url) return url;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
