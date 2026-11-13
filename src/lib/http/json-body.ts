export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Reads a JSON request body defensively: empty, oversized or malformed bodies become a
 * 4xx result instead of an unhandled exception (which previously surfaced as HTTP 500).
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: `Request body is too large (limit ${maxBytes} bytes).` };
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, error: "Request body could not be read." };
  }
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, status: 413, error: `Request body is too large (limit ${maxBytes} bytes).` };
  }
  if (!text.trim()) {
    return { ok: false, status: 400, error: "A JSON request body is required." };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Request body must be valid JSON." };
  }
}

export function bearerToken(request: Request): string | undefined {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
}
