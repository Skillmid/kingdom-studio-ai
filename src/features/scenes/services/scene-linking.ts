import { parseSceneHeading } from "@/features/import-engine/scene-heading";

/**
 * Deterministic scene linking shared by "Sync from screenplay" and the AI scene-approval path,
 * so both write the same characterIds/locationId for the same scene text.
 */

export interface LinkableCharacter {
  id: string;
  name: string;
}

export interface LinkableLocation {
  id: string;
  name: string;
}

export interface SceneLinkContext {
  characters: LinkableCharacter[];
  locations: LinkableLocation[];
}

export interface SceneLinkInput {
  heading?: string;
  locationName?: string;
  sourceText?: string;
  /** Fallback text when sourceText is missing (summary, action, dialogue). */
  fallbackText?: Array<string | undefined>;
}

export interface SceneLinks {
  characterIds: string[];
  locationId?: string;
}

const TIME_SUFFIX = "DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME|SUNSET|SUNRISE";

export function normaliseLocationName(value: string): string {
  return value
    .replace(new RegExp(`\\s+-\\s+(?:${TIME_SUFFIX})\\s*$`, "i"), "")
    .replace(new RegExp(`\\s+(?:${TIME_SUFFIX})\\s*$`, "i"), "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-name, Unicode-aware match ("Tara" no longer matches "guitar"). Names shorter than two
 * characters are ignored, as before.
 */
export function matchCharacterIds(sourceText: string, characters: LinkableCharacter[]): string[] {
  const source = sourceText.toLocaleLowerCase();
  return characters
    .filter((character) => {
      const name = character.name.trim().toLocaleLowerCase();
      if (name.length < 2) return false;
      return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "u").test(source);
    })
    .map((character) => character.id);
}

export function resolveSceneLinks(scene: SceneLinkInput, context: SceneLinkContext): SceneLinks {
  const locationName = scene.locationName ?? (scene.heading ? parseSceneHeading(scene.heading)?.locationName : undefined);
  const locationIds = new Map(context.locations.map((location) => [normaliseLocationName(location.name), location.id]));
  const locationId = locationName ? locationIds.get(normaliseLocationName(locationName)) : undefined;
  const text =
    scene.sourceText?.trim() ||
    [scene.heading, ...(scene.fallbackText ?? [])].filter((part): part is string => Boolean(part?.trim())).join("\n");
  return { characterIds: text ? matchCharacterIds(text, context.characters) : [], locationId };
}
