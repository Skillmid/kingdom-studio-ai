import { isSceneHeading, isScreenplayTransition, toTitleCaseName } from "./scene-heading";

const ACTION_CHARACTER_TOKEN_PATTERN = /\b[A-Z][A-Z0-9.'’-]{1,}\b/g;
const TITLECASE_ACTION_CHARACTER_PATTERN = /\b[A-Z][a-z]{1,23}\b(?=\s+(?:walks|runs|stands|sits|enters|exits|looks|turns|smiles|waves|waits|watches|checks|holds|carries|opens|closes|reads|sleeps|lies|meets|hands|gives|takes|steps|moves|heads|goes|comes)\b)/g;
const RELATION_CHARACTER_PATTERN = /\b(?:from|with|to|by)\s+([A-Z][a-z]{1,23})\b/g;

const NON_CHARACTER_WORDS = new Set([
  "A", "AN", "THE", "AND", "BUT", "OR", "SO", "AS", "AT", "ON", "IN", "OF", "TO", "FROM",
  "WITH", "WITHOUT", "HIS", "HER", "THEIR", "ITS", "THIS", "THAT", "THESE", "THOSE", "ANOTHER",
  "THEN", "NEXT", "LATER", "MEANWHILE", "TYPES", "ADDS", "APPEARS", "FOLLOWS", "DISPLAYS", "LOOKS",
  "WALKS", "ENTERS", "EXITS", "FALLS", "READS", "WRITES", "OPENS", "CLOSES", "PICKS", "HOLDS", "SEES",
  "HEARS", "TURNS", "GRABS", "CHECKS", "PROVERBS", "EMAIL", "PHONE", "MESSAGE", "NOTIFICATION",
  "INTERCUT", "CUT", "FADE", "DISSOLVE", "MONTAGE",
]);

const NON_CHARACTER_TITLECASE_WORDS = new Set([
  "She", "He", "They", "Them", "We", "Us", "You", "I", "Whoever", "Whatever",
  "Someone", "Somebody", "Anyone", "Anybody", "Everyone", "Everybody", "Nobody",
]);

const ACTION_VERBS = new Set([
  "walks", "runs", "stands", "sits", "enters", "exits", "looks", "turns", "smiles", "waves", "waits",
  "watches", "checks", "holds", "carries", "opens", "closes", "reads", "sleeps", "lies", "meets", "hands",
  "gives", "takes", "steps", "moves", "heads", "goes", "comes",
]);

function addName(names: Map<string, string>, rawName: string): void {
  const name = toTitleCaseName(rawName.trim());
  if (!name || name.length < 2 || name.length > 24 || /\d/.test(name)) return;
  if (NON_CHARACTER_WORDS.has(name.toUpperCase())) return;
  if (NON_CHARACTER_TITLECASE_WORDS.has(name)) return;

  const key = name.toLowerCase();
  if (!names.has(key)) names.set(key, name);
}

function isLikelyActionCharacterToken(line: string, token: string, index: number): boolean {
  if (token.length < 2 || token.length > 24) return false;
  if (/\d/.test(token) || NON_CHARACTER_WORDS.has(token)) return false;
  if (!/[a-z]/.test(line)) return false;

  const before = line.slice(0, index);
  const after = line.slice(index + token.length);
  const introducedAfterComma = /,\s*$/.test(before);
  const introducedAfterFrom = /\bfrom\s*$/i.test(before);
  const introducedAfterTo = /\bto\s*$/i.test(before);
  const startsLine = before.trim().length === 0;
  const followedByAge = /^\s*,?\s*\d{1,3}\b/.test(after);
  const followedByAction = new RegExp(
    `^\\s+(?:${Array.from(ACTION_VERBS).join("|")})\\b`,
    "i"
  ).test(after);

  return introducedAfterComma || introducedAfterFrom || introducedAfterTo || startsLine || followedByAge || followedByAction;
}

/**
 * Finds named characters introduced or mentioned in screenplay action.
 * This is only a legacy fallback. New screenplays should use the canonical
 * AI screenplay analysis, but the fallback must still understand common
 * screenplay introductions such as "TARA, 16, ..." and "a message from Femi".
 */
export function extractActionCharacterNames(actionLines: string[]): string[] {
  const names = new Map<string, string>();

  for (const line of actionLines) {
    const trimmed = line.trim();
    if (!trimmed || isSceneHeading(trimmed) || isScreenplayTransition(trimmed)) continue;

    for (const match of trimmed.matchAll(ACTION_CHARACTER_TOKEN_PATTERN)) {
      const token = match[0];
      const index = match.index ?? 0;
      if (isLikelyActionCharacterToken(trimmed, token, index)) addName(names, token);
    }

    for (const match of trimmed.matchAll(TITLECASE_ACTION_CHARACTER_PATTERN)) {
      addName(names, match[0]);
    }

    for (const match of trimmed.matchAll(RELATION_CHARACTER_PATTERN)) {
      addName(names, match[1]);
    }
  }

  return Array.from(names.values());
}
