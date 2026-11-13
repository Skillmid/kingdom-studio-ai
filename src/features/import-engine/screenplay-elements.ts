/**
 * Structural screenplay element classification.
 *
 * A capitalized line is not a character. Character cues require name shape
 * and following dialogue. Action, titles, scene headings, transitions,
 * camera direction, sound, and object descriptions stay out of the cast.
 */

import { TIME_OF_DAY_PATTERN } from "./scene-heading";

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

/** Honorific-led cues ("MRS. OKAFOR", "DR ADE", "PASTOR JAMES") are strong name evidence. */
const HONORIFIC_CUE_PATTERN =
  /^(?:MR|MRS|MS|MISS|DR|PROF|SIR|DAME|LADY|LORD|REV|PASTOR|FATHER|SISTER|BROTHER|AUNTIE|AUNTY|UNCLE|MAMA|PAPA|CHIEF|CAPTAIN|CAPT|SGT|OFFICER|DETECTIVE|INSPECTOR|PRINCE|PRINCESS|KING|QUEEN|ALHAJI|ALHAJA|OGA|IYA|BABA)\.?\s+\S/i;

/** Allowed trailing periods on a name: generational suffixes or initials ("JOHN JR.", "T.J."). */
const NAME_SUFFIX_PERIOD_PATTERN = /(?:\b(?:JR|SR)\.|\b(?:\p{L}\.){2,})$/iu;

/** Inline cue + dialogue on one line ("DAVID: We missed the bus."). Name must be in capitals. */
const INLINE_COLON_CUE_PATTERN = /^([^:]{2,35}?)\s*(\([^)]*\))?\s*:\s+(\S.*)$/u;

/** English indefinite pronouns / third-person determiners that open scene description. */
const DESCRIPTION_LEAD_PATTERN =
  /^(?:a|an|the|this|that|these|those|his|her|their|its|nobody|no one|someone|somebody|everyone|everybody|nothing|something|everything)\s/i;
const THIRD_PERSON_PRESENT_PATTERN = /^(?:he|she|it)\s+\p{Ll}+s\b/iu;
const SPEECH_MARKER_PATTERN =
  /(?:^|[^\p{L}'])(?:i|i'm|i've|i'll|i'd|me|my|mine|we|we're|us|our|you|you're|your|yours)(?![\p{L}'])/iu;

export function sanitizeCharacterCue(rawName: string): string {
  return rawName
    .replace(EXTENSION_PATTERN, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/^["'\s]+|["'\s:]+$/g, "")
    .trim();
}

function isSceneHeading(line: string): boolean {
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
  if (/[!?]$/.test(trimmed)) return false;
  if (/\.$/.test(trimmed) && !NAME_SUFFIX_PERIOD_PATTERN.test(trimmed)) return false;
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

  const letters = baseName.replace(/[^\p{L}]/gu, "");
  if (letters.length < 2) return false;

  // Unicode-aware: "ADÉBÁYỌ̀" is upper case; caseless scripts only qualify via an explicit colon.
  const allUpper = letters === letters.toLocaleUpperCase() && letters !== letters.toLocaleLowerCase();
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
  if (/\p{Ll}/u.test(trimmed) || /^["“]/.test(trimmed)) return true;
  // Shouted dialogue ("NO!", "WHERE IS SHE?") is all caps but ends like speech.
  return /[!?]["”]?$/.test(trimmed) && /\p{Lu}/u.test(trimmed);
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

const BYLINE_PATTERN = /^(?:(?:written|screenplay|story|teleplay|adapted)\s+)?by\b/i;

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
    // The title page precedes the script body. Once the body starts (a transition such as
    // FADE IN or a scene heading), nothing later is the document title — otherwise the first
    // multi-word character cue of a script without a title page was mistaken for its title.
    if (isTransition(line) || isSceneHeading(line)) return null;
    if (line.length > 2 && line.length < 80 && wordCount(line) >= 2 && wordCount(line) <= 8) {
      const following = nextDialogueLine(lines, i);
      const looksLikeCueWithDialogue =
        isNameShapedCharacterCue(line) && hasDialogueEvidence(following) && !BYLINE_PATTERN.test(following ?? "");
      if (looksLikeCueWithDialogue) return null;
      return sanitizeCharacterCue(line);
    }
    if (wordCount(line) === 1 && !isTransition(line)) return null;
  }
  return null;
}

export function titlesMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

/** Unicode-safe display casing for a cue: "ADÉBÁYỌ̀" → "Adébáyọ̀", "MRS. OKAFOR" → "Mrs. Okafor", "O'BRIEN" → "O'Brien". */
export function formatCharacterName(cue: string): string {
  return cue
    .toLocaleLowerCase()
    .replace(/(^|[\s\-'’.])(\p{L})/gu, (_match, separator: string, letter: string) => separator + letter.toLocaleUpperCase());
}

/** Splits "DAVID: We missed the bus." into a cue and its inline dialogue when the name part is cue-shaped. */
export function parseInlineColonCue(line: string): { cue: string; dialogue: string } | null {
  const match = line.trim().match(INLINE_COLON_CUE_PATTERN);
  if (!match) return null;
  const name = match[1].trim();
  const dialogue = match[3].trim();
  const letters = name.replace(/[^\p{L}]/gu, "");
  if (letters.length < 2 || letters !== letters.toLocaleUpperCase() || letters === letters.toLocaleLowerCase()) return null;
  if (!isNameShapedCharacterCue(`${name}:`)) return null;
  if (!hasDialogueEvidence(dialogue)) return null;
  return { cue: name, dialogue };
}

/**
 * True when a line reads like scene description rather than speech: it opens with an article,
 * third-person determiner or indefinite pronoun ("A phone rings.", "Nobody moves.") or a
 * third-person present-tense clause ("She keeps walking."), and carries no speech markers
 * (first/second person, questions, exclamations, quotes).
 */
export function readsAsSceneDescription(line: string | undefined): boolean {
  const trimmed = line?.trim();
  if (!trimmed) return false;
  if (/[?!]["”]?$/.test(trimmed) || /^["“]/.test(trimmed)) return false;
  if (SPEECH_MARKER_PATTERN.test(trimmed)) return false;
  return DESCRIPTION_LEAD_PATTERN.test(trimmed) || THIRD_PERSON_PRESENT_PATTERN.test(trimmed);
}

export interface CharacterCueMatch {
  /** Index into the input lines. */
  index: number;
  /** Upper-cased cue without extensions, e.g. "DAVID". */
  name: string;
  /** Present for inline "NAME: dialogue" cues. */
  inlineDialogue?: string;
}

interface CueCandidate extends CharacterCueMatch {
  following?: string;
  strong: boolean;
}

const RELATIVE_TIME_PATTERN = /^(?:[\p{L}\d]+\s+){0,3}(?:LATER|EARLIER|AGO)$/iu;

/** Time markers used as slug lines: a whole scene-heading time token ("CONTINUOUS") or "MOMENTS LATER". */
export function isTimeMarker(value: string): boolean {
  const trimmed = value.trim();
  const match = trimmed.match(TIME_OF_DAY_PATTERN);
  return Boolean(match && match.index === 0) || RELATIVE_TIME_PATTERN.test(trimmed);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The name is mentioned outside cue lines in a way that marks a person: ALL CAPS inside a
 * mixed-case action line (character introduction convention) or Title Case mid-sentence.
 * Scene headings, transitions and all-caps lines are ignored.
 */
function isMentionedElsewhere(name: string, lines: string[], cueIndexes: Set<number>): boolean {
  const title = formatCharacterName(name);
  const boundary = "(?<![\\p{L}])";
  const end = "(?![\\p{L}])";
  const upper = new RegExp(`${boundary}${escapeRegExp(name)}${end}`, "u");
  const titled = new RegExp(`[^.!?\\s]\\s+${escapeRegExp(title)}${end}`, "u");
  for (let i = 0; i < lines.length; i++) {
    if (cueIndexes.has(i)) continue;
    const line = lines[i].trim();
    if (!line || isSceneHeading(line) || isTransition(line)) continue;
    const isAllCaps = line === line.toLocaleUpperCase();
    if (!isAllCaps && upper.test(line)) return true;
    if (titled.test(line)) return true;
  }
  return false;
}

/**
 * Shared character-cue detection used by every extractor so the cast, scenes and shots agree.
 *
 * A cue needs name shape, must not be the document title, and must be followed by dialogue
 * evidence. To reject slug lines that happen to be followed directly by an action line
 * ("SILENCE" / "Nobody moves.", "MOMENTS LATER" / "The room is empty."), a name is kept only when
 * at least one occurrence is followed by speech rather than scene description, or it has strong
 * evidence: a V.O./O.S./CONT'D extension, a role noun or honorific, or a mention elsewhere in the
 * action. Time-of-day markers used in scene headings (LATER, CONTINUOUS, SAME TIME…) are never cues.
 */
export function detectCharacterCues(lines: string[]): CharacterCueMatch[] {
  const documentTitle = findDocumentTitle(lines);
  const candidates: CueCandidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const inline = parseInlineColonCue(line);
    if (inline) {
      const name = sanitizeCharacterCue(inline.cue).toLocaleUpperCase();
      if (!name || isTimeMarker(name)) continue;
      if (documentTitle && titlesMatch(name, documentTitle)) continue;
      candidates.push({ index: i, name, inlineDialogue: inline.dialogue, following: inline.dialogue, strong: false });
      continue;
    }

    if (!isNameShapedCharacterCue(line)) continue;
    const name = sanitizeCharacterCue(line).toLocaleUpperCase();
    if (!name) continue;
    if (documentTitle && titlesMatch(name, documentTitle)) continue;
    if (isTimeMarker(name)) continue;
    const following = nextDialogueLine(lines, i);
    if (!hasDialogueEvidence(following)) continue;
    const nextLine = lines[i + 1]?.trim();
    const hasParenthetical = Boolean(nextLine && isParenthetical(nextLine));
    const strong =
      EXTENSION_PATTERN.test(line) ||
      ROLE_CUE_PATTERN.test(name) ||
      HONORIFIC_CUE_PATTERN.test(name) ||
      hasParenthetical;
    candidates.push({ index: i, name, following, strong });
  }

  const cueIndexes = new Set(candidates.map((candidate) => candidate.index));
  const accepted = new Map<string, boolean>();
  for (const candidate of candidates) {
    if (accepted.get(candidate.name)) continue;
    if (candidate.strong || !readsAsSceneDescription(candidate.following)) accepted.set(candidate.name, true);
  }
  for (const name of new Set(candidates.map((candidate) => candidate.name))) {
    if (!accepted.get(name) && isMentionedElsewhere(name, lines, cueIndexes)) accepted.set(name, true);
  }

  return candidates
    .filter((candidate) => accepted.get(candidate.name))
    .map(({ index, name, inlineDialogue }) => (inlineDialogue ? { index, name, inlineDialogue } : { index, name }));
}
