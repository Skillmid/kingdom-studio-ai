import { aiGateway } from "@/platform/ai";
import type { SceneStatus } from "@/features/scenes/types/scene";
import { scriptSceneExtractionPrompt } from "./script-scene-extraction-prompt.service";

export interface ExtractedSceneDraft {
  number: number;
  heading: string;
  summary: string;
  status: SceneStatus;
  progress: number;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function parseExtractedScenes(text: string): ExtractedSceneDraft[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanJsonResponse(text));
  } catch {
    throw new Error("AI returned an invalid scene extraction.");
  }

  const data = getRecord(parsed);
  const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
  const scenes: ExtractedSceneDraft[] = [];

  rawScenes.forEach((item, index) => {
    const row = getRecord(item);
    const heading = getString(row.heading).trim();

    if (heading.length < 2) {
      return;
    }

    const number = Math.max(1, Math.round(getNumber(row.number) || index + 1));

    scenes.push({
      number,
      heading: heading.slice(0, 255),
      summary: getString(row.summary).trim(),
      status: "draft",
      progress: 0,
    });
  });

  return scenes;
}

export async function extractScenesFromScreenplay(
  screenplay: string,
): Promise<ExtractedSceneDraft[]> {
  if (!screenplay.trim()) {
    throw new Error("Screenplay content is required for scene extraction.");
  }

  const response = await aiGateway.generate({
    provider: "openrouter",
    systemPrompt: scriptSceneExtractionPrompt.buildSystemPrompt(),
    userPrompt: scriptSceneExtractionPrompt.buildUserPrompt(screenplay),
    temperature: 0.2,
    maxTokens: 5000,
  });

  return parseExtractedScenes(response.text);
}
