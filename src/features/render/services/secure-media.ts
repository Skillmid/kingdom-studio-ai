import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import type { IncomingMessage } from "node:http";
import { checkServerIdentity } from "node:tls";
import { dirname, extname } from "node:path";
import { mkdir } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export type SafeMediaFormat = "mp4" | "mov" | "webm" | "matroska";

export interface DownloadedMedia {
  filePath: string;
  format: SafeMediaFormat;
  bytes: number;
}

type SecureMediaResponse = Readable & Pick<IncomingMessage, "statusCode" | "headers">;
type SecureMediaRequester = (
  url: URL,
  address: string,
  family: number,
  signal: AbortSignal,
  timeoutMs: number,
) => Promise<SecureMediaResponse>;

export interface SecureMediaOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxBytes?: number;
  resolveHost?: (hostname: string) => Promise<Array<{ address: string; family: number }>>;
  request?: SecureMediaRequester;
}

const DEFAULT_TIMEOUT_MS = 15_000;
export const MAX_SECURE_MEDIA_BYTES = 100 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const MIME_FORMATS: Record<string, SafeMediaFormat> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "matroska",
};

function isInIpv4Range(address: string, network: string, prefix: number): boolean {
  const toNumber = (value: string) => value.split(".").reduce((result, part) => (result * 256) + Number(part), 0);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return ((toNumber(address) & mask) >>> 0) === ((toNumber(network) & mask) >>> 0);
}

function ipv6ToGroups(address: string): number[] | null {
  if (address.includes("%")) return null;
  let value = address.toLowerCase();
  const embeddedIpv4 = value.match(/(?:^|:)(\d+\.\d+\.\d+\.\d+)$/);
  if (embeddedIpv4) {
    const octets = embeddedIpv4[1].split(".").map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
    const first = ((octets[0] << 8) | octets[1]).toString(16);
    const second = ((octets[2] << 8) | octets[3]).toString(16);
    value = value.slice(0, -embeddedIpv4[1].length) + first + ":" + second;
  }
  const halves = value.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16));
}

export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const blocked: Array<[string, number]> = [
      ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
      ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
      ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
      ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
    ];
    return blocked.every(([network, prefix]) => !isInIpv4Range(address, network, prefix));
  }
  if (family !== 6) return false;
  const groups = ipv6ToGroups(address);
  if (!groups) return false;
  const [first, second] = groups;
  const isGlobalUnicast = first >= 0x2000 && first <= 0x3fff;
  const isDocumentation = first === 0x2001 && second === 0x0db8;
  const isSpecial2001 = first === 0x2001 && second <= 0x01ff;
  const isSixToFour = first === 0x2002;
  const isDocumentationV6 = first === 0x3fff && second < 0x1000;
  return isGlobalUnicast && !isDocumentation && !isSpecial2001 && !isSixToFour && !isDocumentationV6;
}

function validateMediaUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("source_url_invalid: Media source URL is invalid.");
  }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("source_url_invalid: Media sources must use HTTPS on the standard port without embedded credentials.");
  }
  if (!url.hostname || url.hostname.endsWith(".") || url.hostname.includes("%")) {
    throw new Error("source_url_invalid: Media source hostname is invalid.");
  }
  return url;
}

async function resolvePublicAddresses(
  hostname: string,
  resolver: (hostname: string) => Promise<Array<{ address: string; family: number }>>,
): Promise<Array<{ address: string; family: number }>> {
  const literalFamily = isIP(hostname);
  let records: Array<{ address: string; family: number }>;
  try {
    records = literalFamily
      ? [{ address: hostname, family: literalFamily }]
      : await resolver(hostname);
  } catch {
    throw new Error("source_fetch_failed: Media source hostname could not be resolved.");
  }
  if (records.length === 0 || records.some(({ address }) => !isPublicIpAddress(address))) {
    throw new Error("source_url_invalid: Media source resolves to a private or reserved network address.");
  }
  return records;
}

export async function validatePublicMediaUrl(
  input: string,
  resolver: (hostname: string) => Promise<Array<{ address: string; family: number }>> =
    (hostname) => lookup(hostname, { all: true, verbatim: true }),
): Promise<{ url: URL; addresses: Array<{ address: string; family: number }> }> {
  const url = validateMediaUrl(input);
  const addresses = await resolvePublicAddresses(url.hostname, resolver);
  return { url, addresses };
}

function requestPinned(url: URL, address: string, family: number, signal: AbortSignal, timeoutMs: number): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = httpsRequest({
      protocol: "https:",
      hostname: address,
      family,
      port: 443,
      method: "GET",
      path: `${url.pathname}${url.search}`,
      servername: isIP(url.hostname) ? undefined : url.hostname,
      checkServerIdentity: (_hostname, certificate) => checkServerIdentity(url.hostname, certificate),
      headers: { Host: url.host, Accept: Object.keys(MIME_FORMATS).join(", ") },
      signal,
    }, resolve);
    request.setTimeout(timeoutMs, () => request.destroy(new Error("Media source request timed out.")));
    request.once("error", reject);
    request.end();
  });
}

async function responseForUrl(
  initialUrl: string,
  options: Required<Pick<SecureMediaOptions, "timeoutMs">>
    & Pick<SecureMediaOptions, "signal" | "resolveHost" | "request">,
): Promise<{ response: SecureMediaResponse; format: SafeMediaFormat; url: URL }> {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  try {
    let url = validateMediaUrl(initialUrl);
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const { addresses } = await validatePublicMediaUrl(url.toString(), options.resolveHost);
      const request = options.request ?? requestPinned;
      const response = await request(url, addresses[0].address, addresses[0].family, controller.signal, options.timeoutMs);
      if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
        const location = response.headers.location;
        response.destroy();
        if (!location || redirectCount === MAX_REDIRECTS) throw new Error("source_fetch_failed: Media source exceeded the redirect limit.");
        url = validateMediaUrl(new URL(location, url).toString());
        continue;
      }
      if (response.statusCode !== 200) {
        response.destroy();
        throw new Error(`source_fetch_failed: Media source returned HTTP ${response.statusCode ?? "unknown"}.`);
      }
      const contentType = response.headers["content-type"]?.split(";")[0]?.trim().toLowerCase() ?? "";
      const format = MIME_FORMATS[contentType];
      if (!format) {
        response.destroy();
        throw new Error(`unsupported_media_type: Media source type '${contentType || "unknown"}' is not permitted.`);
      }
      return { response, format, url };
    }
    throw new Error("source_fetch_failed: Media source exceeded the redirect limit.");
  } finally {
    options.signal?.removeEventListener("abort", abort);
  }
}

export async function downloadSecureMedia(
  sourceUrl: string,
  destinationPath: string,
  options: SecureMediaOptions = {},
): Promise<DownloadedMedia> {
  const maxBytes = options.maxBytes ?? MAX_SECURE_MEDIA_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(new Error("Media download timed out.")), timeoutMs);
  const signals = options.signal ? [options.signal, timeoutController.signal] : [timeoutController.signal];
  const signal = AbortSignal.any(signals);
  let response: Awaited<ReturnType<typeof responseForUrl>> | undefined;
  let filePath: string | undefined;
  try {
    response = await responseForUrl(sourceUrl, {
      timeoutMs,
      signal,
      resolveHost: options.resolveHost,
      request: options.request,
    });
  const declaredLength = Number(response.response.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    response.response.destroy();
    throw new Error(`input_too_large: Media source exceeds the ${maxBytes}-byte download limit.`);
  }
  const expectedExtension = { mp4: ".mp4", mov: ".mov", webm: ".webm", matroska: ".mkv" }[response.format];
  const destinationExtension = extname(destinationPath).toLowerCase();
  if (destinationExtension && destinationExtension !== expectedExtension) {
    response.response.destroy();
    throw new Error("source_url_invalid: Download destination extension does not match the detected media type.");
  }
  filePath = destinationExtension ? destinationPath : `${destinationPath}${expectedExtension}`;
  await mkdir(dirname(filePath), { recursive: true });
  let bytes = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        callback(new Error(`input_too_large: Media source exceeds the ${maxBytes}-byte download limit.`));
        return;
      }
      callback(null, chunk);
    },
  });
  try {
    await pipeline(response.response, limiter, createWriteStream(filePath, { flags: "wx" }), {
      signal,
    });
  } catch (caught) {
    await unlink(filePath).catch(() => undefined);
    throw caught;
  }
  return { filePath, format: response.format, bytes };
  } catch (caught) {
    response?.response.destroy();
    if (filePath) await unlink(filePath).catch(() => undefined);
    if (timeoutController.signal.aborted && !options.signal?.aborted) {
      throw new Error(`source_fetch_failed: Media download timed out after ${timeoutMs} ms.`);
    }
    throw caught;
  } finally {
    clearTimeout(timeout);
  }
}
