import type {
  AnalyzedCharacter,
  AnalyzedLocation,
  AnalyzedScene,
  ScreenplayAnalysis,
} from "../types/screenplay-analysis";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function normaliseCharacter(value: unknown): AnalyzedCharacter | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const name = cleanString(item.name);
  if (!name) return null;

  const kind = item.kind === "role" || item.kind === "unknown" ? item.kind : "named";
  const evidence = Array.isArray(item.evidence)
    ? item.evidence
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const source = entry as Record<string, unknown>;
          const text = cleanString(source.text);
          if (!text) return null;
          const sceneNumber = Number(source.sceneNumber);
          return {
            text,
            ...(Number.isFinite(sceneNumber) && sceneNumber > 0 ? { sceneNumber } : {}),
          };
        })
        .filter((entry): entry is { text: string; sceneNumber?: number } => Boolean(entry))
    : [];

  return {
    name,
    kind,
    speaks: item.speaks === true,
    dialogueCount: Math.max(0, Number(item.dialogueCount) || 0),
    introduction: cleanString(item.introduction) || undefined,
    evidence,
  };
}

function normaliseLocation(value: unknown): AnalyzedLocation | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const name = cleanString(item.name);
  const sourceHeading = cleanString(item.sourceHeading);
  if (!name || !sourceHeading) return null;

  const setting = item.setting === "exterior" || item.setting === "both" ? item.setting : "interior";
  const sceneNumbers = Array.from(
    new Set(
      (Array.isArray(item.sceneNumbers) ? item.sceneNumbers : [])
        .map((number) => Number(number))
        .filter((number) => Number.isInteger(number) && number > 0)
    )
  );

  return { name, setting, sourceHeading, sceneNumbers };
}

function normaliseScene(value: unknown): AnalyzedScene | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const number = Number(item.number);
  const heading = cleanString(item.heading);
  const locationName = cleanString(item.locationName);
  if (!Number.isInteger(number) || number < 1 || !heading || !locationName) return null;

  const sceneType = item.sceneType === "EXT" || item.sceneType === "BOTH" ? item.sceneType : "INT";
  const dialogue = Array.isArray(item.dialogue)
    ? item.dialogue
        .map((beat) => {
          if (!beat || typeof beat !== "object") return null;
          const source = beat as Record<string, unknown>;
          const character = cleanString(source.character);
          const text = cleanString(source.dialogue);
          if (!character || !text) return null;
          return {
            character,
            dialogue: text,
            parenthetical: cleanString(source.parenthetical) || undefined,
          };
        })
        .filter(
          (beat): beat is { character: string; dialogue: string; parenthetical?: string } =>
            Boolean(beat)
        )
    : [];

  return {
    number,
    heading,
    sceneType,
    locationName,
    timeOfDay: cleanString(item.timeOfDay) || undefined,
    action: cleanStringArray(item.action),
    dialogue,
    characterNames: Array.from(new Set(cleanStringArray(item.characterNames))),
    sourceText: cleanString(item.sourceText),
  };
}

export function validateScreenplayAnalysis(input: unknown): ScreenplayAnalysis {
  if (!input || typeof input !== "object") {
    throw new Error("AI returned an invalid screenplay analysis.");
  }

  const source = input as Record<string, unknown>;
  const characters = Array.isArray(source.characters)
    ? source.characters
        .map(normaliseCharacter)
        .filter((item): item is AnalyzedCharacter => Boolean(item))
    : [];
  const locations = Array.isArray(source.locations)
    ? source.locations
        .map(normaliseLocation)
        .filter((item): item is AnalyzedLocation => Boolean(item))
    : [];
  const scenes = Array.isArray(source.scenes)
    ? source.scenes
        .map(normaliseScene)
        .filter((item): item is AnalyzedScene => Boolean(item))
    : [];

  if (scenes.length === 0 && characters.length === 0 && locations.length === 0) {
    throw new Error("AI returned an empty screenplay analysis.");
  }

  return {
    schemaVersion: 1,
    title: cleanString(source.title) || undefined,
    logline: cleanString(source.logline) || undefined,
    characters,
    locations,
    scenes,
  };
}

export async function analyzeScreenplay(content: string): Promise<ScreenplayAnalysis> {
  if (!content.trim()) throw new Error("Screenplay content cannot be empty.");

  const response = await fetch("/api/ai/analyze-screenplay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ screenplay: content }),
  });

  const data = (await response.json()) as { analysis?: unknown; error?: string };
  if (!response.ok) throw new Error(data.error || "Unable to analyse screenplay.");
  return validateScreenplayAnalysis(data.analysis);
}
