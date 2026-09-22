export type SceneHeadingParts = {
  prefix: "INT" | "EXT" | "BOTH";
  locationName: string;
  timeOfDay?: string;
  heading: string;
};

const TIME_OF_DAY_PATTERN =
  /(?:^|\s)(DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME(?:\s+TIME)?)(?:\s*)$/i;

const SCENE_PREFIX_PATTERN =
  /^(INT\s*\/\s*EXT|EXT\s*\/\s*INT|I\s*\/\s*E|INT\.?|EXT\.?|INTERIOR|EXTERIOR)\s*(?:[-–—:]\s*)?(.+)$/i;

const SCENE_START_PATTERN =
  /(?:^|\s)(?=(?:SCENE\s*#?\s*\d+\s*[:.)-]\s*|\d+\s*[.)-]\s*)?(?:INT\s*\/\s*EXT|EXT\s*\/\s*INT|I\s*\/\s*E|INT\.?|EXT\.?|INTERIOR|EXTERIOR)\b)/gi;

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

/**
 * Imported scripts can come from TXT, DOCX/PDF conversion, markdown, or
 * rich-text editors. Normalize those representations before the extractors
 * attempt to identify screenplay headings.
 */
export function splitScreenplayLines(screenplay: string): string[] {
  if (!screenplay?.trim()) return [];

  let normalized = screenplay
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/<\/?(?:p|div|section|article|h[1-6]|li|br)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ");

  normalized = decodeBasicHtmlEntities(normalized);

  // Some imported/rich-text documents collapse paragraphs into one physical
  // line. Re-introduce a boundary immediately before a screenplay heading.
  normalized = normalized.replace(SCENE_START_PATTERN, "\n");

  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanHeadingLine(value: string): string {
  let line = decodeBasicHtmlEntities(value)
    .replace(/^\uFEFF/, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  for (let i = 0; i < 3; i += 1) {
    line = line
      .replace(/^\s*(?:#{1,6}|>|[-*•])\s*/g, "")
      .replace(/^\s*\*\*(.+)\*\*\s*$/s, "$1")
      .replace(/^\s*__(.+)__\s*$/s, "$1")
      .replace(/^\s*`(.+)`\s*$/s, "$1")
      .trim();
  }

  line = line
    .replace(/^SCENE\s*#?\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/^\d+\s*[.)-]\s*(?=(?:INT\.?|EXT\.?|INTERIOR|EXTERIOR|INT\s*\/\s*EXT|EXT\s*\/\s*INT|I\s*\/\s*E))/i, "")
    .trim();

  return line;
}

function normaliseLocationName(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[\s-–—:]+$/, "")
    .trim();
}

export function parseSceneHeading(value: string): SceneHeadingParts | null {
  const cleaned = cleanHeadingLine(value);
  const match = cleaned.match(SCENE_PREFIX_PATTERN);

  if (!match?.[1] || !match[2]) {
    return null;
  }

  const prefixRaw = match[1].toUpperCase().replace(/\s/g, "");
  const prefix: SceneHeadingParts["prefix"] =
    prefixRaw.startsWith("INT/EXT") ||
    prefixRaw.startsWith("EXT/INT") ||
    prefixRaw === "I/E"
      ? "BOTH"
      : prefixRaw.startsWith("EXT") || prefixRaw === "EXTERIOR"
        ? "EXT"
        : "INT";

  const remainder = match[2].trim();
  const timeMatch = remainder.match(TIME_OF_DAY_PATTERN);
  const timeOfDay = timeMatch?.[1]?.replace(/\s+/g, " ").toUpperCase();
  const locationName = normaliseLocationName(
    timeMatch ? remainder.slice(0, timeMatch.index).trim() : remainder,
  );

  if (!locationName || locationName.length < 2 || locationName.length > 120) {
    return null;
  }

  return {
    prefix,
    locationName,
    timeOfDay,
    heading: cleaned,
  };
}

export function isSceneHeading(value: string): boolean {
  return parseSceneHeading(value) !== null;
}
