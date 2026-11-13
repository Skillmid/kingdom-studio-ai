/**
 * Slugs for NEW productions only (existing slugs are never rewritten).
 *
 * - Unicode-safe: accents are folded ("Adébáyọ̀" -> "adebayo"); letters and digits from any script
 *   are kept, so non-Latin titles do not collapse to an empty slug.
 * - Never empty: falls back to "production".
 * - Deterministic base: the same title always gives the same base; only the suffix is random.
 * - Collision handling: the repository migration declares `productions.slug text not null unique`
 *   (20260627131515_create_productions.sql), so the DATABASE is the final uniqueness guarantee.
 *   A random 6-character suffix makes collisions unlikely; if an insert still fails with a unique
 *   violation on the slug, createWithUniqueSlug() retries a bounded number of times with a fresh
 *   suffix. A failed INSERT writes nothing, so a retry cannot create a duplicate production. Any
 *   other error (including unique violations on other constraints) is surfaced unchanged.
 *   Routes use production ids, not slugs.
 */

export const MAX_SLUG_BASE_LENGTH = 60;
const SUFFIX_LENGTH = 6;
const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function slugBase(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  const trimmed = Array.from(base).slice(0, MAX_SLUG_BASE_LENGTH).join("").replace(/-+$/g, "");
  return trimmed || "production";
}

export function randomSlugSuffix(randomValues: (array: Uint8Array) => Uint8Array = (array) => crypto.getRandomValues(array)): string {
  const bytes = randomValues(new Uint8Array(SUFFIX_LENGTH));
  return Array.from(bytes, (byte) => SUFFIX_ALPHABET[byte % SUFFIX_ALPHABET.length]).join("");
}

export function createProductionSlug(title: string, suffix: string = randomSlugSuffix()): string {
  return `${slugBase(title)}-${suffix}`;
}

/** Total insert attempts for a new production when the slug collides (first try + 2 retries). */
export const MAX_SLUG_INSERT_ATTEMPTS = 3;

/** Postgres unique_violation on the productions slug constraint (e.g. productions_slug_key). */
export function isSlugUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, message, details } = error as { code?: unknown; message?: unknown; details?: unknown };
  if (code !== "23505") return false;
  const text = [message, details].filter((part): part is string => typeof part === "string").join(" ");
  return /\bslug\b|_slug_/i.test(text);
}

/**
 * Inserts a new production with a fresh slug, retrying ONLY on a slug unique violation, at most
 * MAX_SLUG_INSERT_ATTEMPTS times in total. The last slug collision (or any other error) is rethrown.
 */
export async function createWithUniqueSlug<T>(
  title: string,
  insert: (slug: string) => Promise<T>,
  options: { maxAttempts?: number; suffix?: () => string } = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? MAX_SLUG_INSERT_ATTEMPTS);
  const nextSuffix = options.suffix ?? (() => randomSlugSuffix());
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await insert(createProductionSlug(title, nextSuffix()));
    } catch (error) {
      if (attempt >= maxAttempts || !isSlugUniqueViolation(error)) throw error;
    }
  }
}
