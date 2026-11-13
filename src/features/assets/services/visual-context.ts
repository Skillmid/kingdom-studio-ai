/**
 * Shared, pure composition of inherited visual context for generation prompts.
 *
 * Sources (only what the production records actually contain — nothing is invented):
 * - Production Creative DNA: art style + aspect ratio (existing `[Creative Direction: ...]` format)
 * - Story Bible: `visual_consistency` (visual rules) and `forbidden_elements` (things to avoid).
 *   `ai_rules` is labelled "AI Writing Rules" and `ai_context` is a broad free-text memory, so
 *   neither is injected into image prompts (their semantics are not visual).
 * - Character appearance for characters linked to the shot/panel
 * - Location context for the linked location
 * - The shot/panel intent (generation prompt or recorded visual evidence)
 * - Creator-approved director notes linked to the same panel, shot, or scene (scene-level only)
 *
 * Segments are de-duplicated case-insensitively and skipped when already present in the intent.
 */
import {
  formatCreativePromptDirective,
  normalizeAspectRatio,
} from "@/features/productions/services/production-creative-dna";

/** Stays under the strictest provider prompt limit in use (Kling: 2,500 characters). */
export const MAX_COMPOSED_PROMPT_LENGTH = 2400;

export interface VisualCreativeInput {
  artStyle?: string | null;
  aspectRatio?: string | null;
}

export interface VisualStoryBibleInput {
  visualConsistency?: string | null;
  forbiddenElements?: string | null;
}

export interface VisualCharacterInput {
  id?: string;
  name: string;
  appearance?: string;
  distinguishingFeatures?: string;
  hairColor?: string;
  eyeColor?: string;
}

export interface VisualLocationInput {
  id?: string;
  name: string;
  setting?: string;
  description?: string;
}

export interface VisualDirectorNoteInput {
  id?: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  userApproved?: boolean;
  composition?: string;
  camera?: string;
  lighting?: string;
  continuity?: string;
}

export interface VisualContextInput {
  intent?: string;
  creative?: VisualCreativeInput | null;
  storyBible?: VisualStoryBibleInput | null;
  characters?: VisualCharacterInput[];
  location?: VisualLocationInput | null;
  directorNotes?: VisualDirectorNoteInput[];
  maxLength?: number;
}

function clean(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[\s.;,]+$/u, "");
}

export function creativeDirective(creative?: VisualCreativeInput | null): string | undefined {
  if (!creative || (!clean(creative.artStyle) && !clean(creative.aspectRatio))) return undefined;
  return formatCreativePromptDirective({
    artStyle: clean(creative.artStyle) || null,
    aspectRatio: normalizeAspectRatio(creative.aspectRatio),
  });
}

export function storyBibleVisualRules(storyBible?: VisualStoryBibleInput | null): string[] {
  if (!storyBible) return [];
  const rules: string[] = [];
  const consistency = clean(storyBible.visualConsistency);
  const forbidden = clean(storyBible.forbiddenElements);
  if (consistency) rules.push(`Visual consistency: ${stripTrailingPunctuation(consistency)}.`);
  if (forbidden) rules.push(`Avoid: ${stripTrailingPunctuation(forbidden)}.`);
  return rules;
}

export function characterAppearance(character: VisualCharacterInput): string | undefined {
  const traits = [
    clean(character.appearance),
    clean(character.distinguishingFeatures),
    clean(character.hairColor) ? `hair ${clean(character.hairColor)}` : "",
    clean(character.eyeColor) ? `eyes ${clean(character.eyeColor)}` : "",
  ].filter(Boolean);
  const name = clean(character.name);
  if (!name) return undefined;
  return traits.length > 0 ? `${name} (${traits.join(", ")})` : name;
}

function locationContext(location?: VisualLocationInput | null): string | undefined {
  if (!location || !clean(location.name)) return undefined;
  const detail = [clean(location.setting), clean(location.description)].filter(Boolean).join(", ");
  return detail ? `${clean(location.name)} (${detail})` : clean(location.name);
}

function directorDirection(notes: VisualDirectorNoteInput[] = []): string | undefined {
  const parts = notes
    .filter((note) => note.userApproved)
    .flatMap((note) => [note.composition, note.camera, note.lighting, note.continuity].map(clean))
    .filter(Boolean);
  return parts.length > 0 ? [...new Set(parts)].join("; ") : undefined;
}

/**
 * Director notes relevant to a shot or panel: notes for the same panel, the same shot (not tied to
 * another panel), or scene-level notes (no shot/panel) for the same scene. Never notes for other
 * shots or scenes.
 */
export function relevantDirectorNotes<T extends VisualDirectorNoteInput>(
  notes: T[],
  target: { sceneId?: string; shotId?: string; panelId?: string },
): T[] {
  return notes.filter((note) => {
    if (!note.userApproved) return false;
    if (target.panelId && note.panelId) return note.panelId === target.panelId;
    if (note.panelId) return false;
    if (target.shotId && note.shotId) return note.shotId === target.shotId;
    if (note.shotId) return false;
    return Boolean(target.sceneId && note.sceneId === target.sceneId);
  });
}

/**
 * Composes a prompt from ordered segments. When the result would exceed `maxLength`, the lowest
 * priority segments (director direction, then location, then characters, then visual consistency)
 * are dropped first; the intent, creative directive and "Avoid" rules are kept.
 */
export function composeVisualPrompt(input: VisualContextInput): string | undefined {
  const maxLength = input.maxLength ?? MAX_COMPOSED_PROMPT_LENGTH;
  const intent = clean(input.intent);
  const intentKey = intent.toLowerCase();
  const characters = (input.characters ?? [])
    .map(characterAppearance)
    .filter((value): value is string => Boolean(value));
  const [consistencyRule, avoidRule] = (() => {
    const rules = storyBibleVisualRules(input.storyBible);
    return [rules.find((rule) => rule.startsWith("Visual consistency")), rules.find((rule) => rule.startsWith("Avoid"))];
  })();
  const location = locationContext(input.location);
  const direction = directorDirection(input.directorNotes);

  type Segment = { text: string; priority: number };
  const candidates: Array<Segment | null> = [
    intent ? { text: /[.!?]$/.test(intent) ? intent : `${intent}.`, priority: 0 } : null,
    characters.length > 0 ? { text: `Characters: ${characters.join("; ")}.`, priority: 3 } : null,
    location ? { text: `Location: ${location}.`, priority: 4 } : null,
    direction ? { text: `Direction: ${direction}.`, priority: 5 } : null,
    consistencyRule ? { text: consistencyRule, priority: 2 } : null,
    avoidRule ? { text: avoidRule, priority: 1 } : null,
    (() => {
      const directive = creativeDirective(input.creative);
      return directive ? { text: directive, priority: 0 } : null;
    })(),
  ];

  const seen = new Set<string>();
  let segments = candidates.filter((segment): segment is Segment => {
    if (!segment) return false;
    const key = segment.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    // Skip context the intent already states verbatim (e.g. a creator prompt that already lists the style).
    if (segment.priority > 0) {
      const body = key.replace(/^[a-z ]+:\s*/, "").replace(/\.$/, "");
      if (body && intentKey.includes(body)) return false;
    }
    return true;
  });
  if (segments.length === 0) return undefined;

  const join = (parts: Segment[]) => parts.map((part) => part.text).join(" ");
  while (join(segments).length > maxLength) {
    const droppable = segments.filter((segment) => segment.priority >= 2);
    if (droppable.length === 0) break;
    const lowest = droppable.reduce((a, b) => (b.priority > a.priority ? b : a));
    segments = segments.filter((segment) => segment !== lowest);
  }
  const prompt = join(segments);
  return prompt.length > maxLength ? prompt.slice(0, maxLength).trimEnd() : prompt;
}

/** Character reference prompt that inherits the production's style instead of a hard-coded look. */
export function buildCharacterReferencePrompt(
  character: VisualCharacterInput & { occupation?: string },
  creative?: VisualCreativeInput | null,
  storyBible?: VisualStoryBibleInput | null,
): string {
  const appearance = characterAppearance(character) ?? clean(character.name);
  const occupation = clean(character.occupation);
  const intent =
    `Character reference still of ${appearance}${occupation ? `, ${occupation}` : ""}. ` +
    "Clear facial structure, full costume silhouette, neutral pose for continuity.";
  return composeVisualPrompt({ intent, creative, storyBible }) ?? intent;
}
