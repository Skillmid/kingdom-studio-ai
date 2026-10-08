/**
 * Structural screenplay element classification.
 *
 * A capitalized line is not a character. Character cues require name shape
 * and following dialogue. Action, titles, scene headings, transitions,
 * camera direction, sound, and object descriptions stay out of the cast.
 */

export type ScreenplayElementKind =
  | "character_cue"
  | "action"
  | "location"
  | "object"
  | "scene_heading"
  | "transition"
  | "camera"
  | "sound"
  | "title"
  | "parenthetical"
  | "dialogue"
  | "other";

const TRANSITION_PATTERN =
  /^(?:CUT TO|FADE IN|FADE OUT|FADE TO(?: BLACK)?|DISSOLVE TO|SMASH CUT(?: TO)?|MATCH CUT(?: TO)?|WIPE TO|JUMP CUT TO|INTERCUT|THE END|CONTINUED|SCENE START|SCENE END|MONTAGE)[:.]?$/i;

const SCENE_HEADING_PATTERN =
  /^(?:\d+[A-Z]?\.\s*)?(?:INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT|EXT|I\/E|E\/I|EST|INTERIOR|EXTERIOR)(?:[\.\s:/]|$)/i;

const CAMERA_PATTERN =
  /^(?:CLOSE(?:\s+UP|\s+ON)?|CLOSEUP|WIDE(?:\s+SHOT|\s+ON)?|ANGLE ON|POV|POINT OF VIEW|INSERT|BACK TO|REVERSE(?:\s+ANGLE)?|TRACKING(?:\s+SHOT)?|PAN(?:\s+TO)?|PUSH IN|CRANE(?:\s+SHOT)?|AERIAL(?:\s+SHOT)?|EXTREME CLOSE(?:\s+UP)?)(?:\b|[:.])/i;

const SOUND_PATTERN =
  /^(?:SFX|FX|SOUND(?:S)?(?:\s+OF)?|MUSIC(?:\s+UP|\s+IN|\s+OUT)?|SCORE)(?:\b|[:.])/i;

const TITLE_MARKER_PATTERN = /^(?:TITLE(?:\s+CARD)?|SUPER(?:\s+TITLE)?|CAPTION)\s*:?\s*$/i;
const TITLE_PREFIX_PATTERN = /^(?:TITLE|SCRIPT TITLE|PROJECT TITLE|SUPER)\s*:\s*(.+)$/i;

const PRONOUN_SUBJECT_PATTERN = /^(?:HE|SHE|THEY|IT|WE|I)\b/i;
const PREPOSITION_LEAD_PATTERN =
  /^(?:INSIDE|OUTSIDE|ABOVE|BELOW|BEHIND|UNDER|NEAR|ACROSS|THROUGH|AROUND|ONTO|INTO|WITHIN)\b/i;

const CLAUSAL_VERB_PATTERN =
  /\b(?:is|are|was|were|be|been|being|types?|typing|looks?|looking|walks?|walking|opens?|opening|sits?|sitting|stands?|standing|holds?|holding|labelled|labeled|enters?|entering|exits?|turns?|runs?|running|sees?|hears?|says?|goes|going|comes?|coming|picks?|puts?|takes?|makes?|has|have|had|watches?|grabs?|writes?|writing)\b/i;

const ROLE_CUE_PATTERN =
  /^(?:THE\s+)?(?:OLD\s+|YOUNG\s+|LITTLE\s+)?(?:MAN|WOMAN|BOY|GIRL|CHILD|KID|TEEN|BABY|MUM|MOM|DAD|MOTHER|FATHER|SON|DAUGHTER|WIFE|HUSBAND|BROTHER|SISTER|CONDUCTOR|DRIVER|GUARD|NURSE|DOCTOR|OFFICER|CLERK|WAITER|WAITRESS|AGENT|VOICE|NARRATOR|BOSS|TEACHER|STUDENT|PASSENGER|STRANGER|NEIGHBOUR|NEIGHBOR|POLICE|SOLDIER|PRIEST|PASTOR)\b$/i;

const EXTENSION_PATTERN = /\s*\((?:V\.?O\.?|O\.?S\.?|O\.?C\.?|CONT'?D|CONTINUED)\)\s*$/i;

export function sanitizeCharacterCue(rawName: string): string {
  return rawName
    .replace(EXTENSION_PATTERN, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/^["'\s]+|["'\s:]+$/g, "")
    .trim();
}

export function isSceneHeading(line: string): boolean {
  return SCENE_HEADING_PATTERN.test(line.trim());
}

export function isTransition(line: string): boolean {
  return TRANSITION_PATTERN.test(line.trim());
}

export function isParenthetical(line: string): boolean {
  return /^\([^)]*\)$/.test(line.trim());
}

export function isCameraDirection(line: string): boolean {
  return CAMERA_PATTERN.test(line.trim());
}

export function isSoundCue(line: string): boolean {
  return SOUND_PATTERN.test(line.trim());
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

export function isNameShapedCharacterCue(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 40) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  if (isSceneHeading(trimmed) || isTransition(trimmed) || isCameraDirection(trimmed) || isSoundCue(trimmed)) {
    return false;
  }
  if (TITLE_MARKER_PATTERN.test(trimmed) || TITLE_PREFIX_PATTERN.test(trimmed)) return false;

  const baseName = sanitizeCharacterCue(trimmed);
  if (!baseName || baseName.length < 2 || baseName.length > 35) return false;
  if (PRONOUN_SUBJECT_PATTERN.test(baseName)) return false;
  if (PREPOSITION_LEAD_PATTERN.test(baseName)) return false;
  if (CLAUSAL_VERB_PATTERN.test(baseName)) return false;

  const words = baseName.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;

  const articleLed = /^(?:THE|A|AN)\b/i.test(baseName);
  if (articleLed && !ROLE_CUE_PATTERN.test(baseName)) return false;

  const letters = baseName.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2) return false;

  const allUpper = letters === letters.toUpperCase();
  const explicitCue = /:\s*$/.test(trimmed);
  return allUpper || explicitCue;
}

export function classifyScreenplayLine(
  line: string,
  context: { isDocumentTitle?: boolean; isFrontMatter?: boolean } = {},
): ScreenplayElementKind {
  const trimmed = line.trim();
  if (!trimmed) return "other";
  if (isParenthetical(trimmed)) return "parenthetical";
  if (isSceneHeading(trimmed)) return "scene_heading";
  if (isTransition(trimmed)) return "transition";
  if (isCameraDirection(trimmed)) return "camera";
  if (isSoundCue(trimmed)) return "sound";
  if (context.isDocumentTitle || TITLE_MARKER_PATTERN.test(trimmed) || TITLE_PREFIX_PATTERN.test(trimmed)) {
    return "title";
  }
  if (context.isFrontMatter && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && wordCount(trimmed) >= 2) {
    return "title";
  }
  if (PREPOSITION_LEAD_PATTERN.test(trimmed)) {
    return /\b(?:labelled|labeled|drive|phone|letter|note|box|bag|key|screen)\b/i.test(trimmed)
      ? "object"
      : "action";
  }
  if (PRONOUN_SUBJECT_PATTERN.test(trimmed) || CLAUSAL_VERB_PATTERN.test(trimmed)) return "action";
  if (isNameShapedCharacterCue(trimmed)) return "character_cue";
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) return "action";
  if (/[a-z]/.test(trimmed) || /^["“]/.test(trimmed)) return "dialogue";
  return "other";
}

export function hasDialogueEvidence(line: string | undefined): boolean {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (
    isSceneHeading(trimmed) ||
    isTransition(trimmed) ||
    isCameraDirection(trimmed) ||
    isSoundCue(trimmed) ||
    isParenthetical(trimmed) ||
    TITLE_MARKER_PATTERN.test(trimmed)
  ) {
    return false;
  }
  if (isNameShapedCharacterCue(trimmed)) return false;
  return /[a-z]/.test(trimmed) || /^["“]/.test(trimmed);
}

export function nextDialogueLine(lines: string[], index: number): string | undefined {
  for (let i = index + 1; i < lines.length; i++) {
    const candidate = lines[i].trim();
    if (!candidate) return undefined;
    if (isParenthetical(candidate)) continue;
    return candidate;
  }
  return undefined;
}

export function findDocumentTitle(lines: string[]): string | null {
  const limit = Math.min(lines.length, 20);
  for (let i = 0; i < limit; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const prefixed = line.match(TITLE_PREFIX_PATTERN);
    if (prefixed?.[1]) return sanitizeCharacterCue(prefixed[1]);
    if (TITLE_MARKER_PATTERN.test(line)) {
      const following = nextDialogueLine(lines, i);
      return following ? sanitizeCharacterCue(following) : null;
    }
    if (isTransition(line) || isSceneHeading(line)) continue;
    if (line.length > 2 && line.length < 80 && wordCount(line) >= 2 && wordCount(line) <= 8) {
      return sanitizeCharacterCue(line);
    }
    if (wordCount(line) === 1 && !isTransition(line)) return null;
  }
  return null;
}

export function titlesMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
