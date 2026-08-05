import {
  aiGateway,
} from "@/platform/ai";

import {
  scriptAnalysisPrompt,
} from "./script-analysis-prompt.service";

import {
  scriptReviewPrompt,
} from "./script-review-prompt.service";

import type {
  ScriptAnalysis,
  ScriptReview,
  ScriptReviewIssue,
  ScriptReviewSeverity,
  ScriptReviewType,
} from "../types/script-analysis";

function createEmptyAnalysis(): ScriptAnalysis {
  return {
    screenplay: {
      title: "",
      pages: 0,
      acts: 0,
      scenes: 0,
      format: "",
    },

    story: {
      genre: "",
      theme: "",
      logline: "",
      synopsis: "",
      strengths: [],
      weaknesses: [],
      recommendations: [],
    },

    characters: [],

    scenes: [],

    dialogue: {
      score: 0,
      strengths: [],
      improvements: [],
    },

    spirituality: {
      biblicalAlignment: 0,
      kingdomMessage: "",
      scriptureReferences: [],
      recommendations: [],
    },

    culture: {
      country: "",
      culture: "",
      language: "",
      authenticity: 0,
      recommendations: [],
    },

    professional: {
      score: 0,
      screenplayFormat: [],
      industryJargon: [],
      continuity: [],
      clarity: [],
      recommendations: [],
    },

    production: {
      budget: "",
      complexity: "",
      risks: [],
      recommendations: [],
    },
  };
}

function getString(
  value: unknown
): string {
  return typeof value === "string"
    ? value
    : "";
}

function getNumber(
  value: unknown
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

function getScore(
  value: unknown
): number {
  return Math.max(
    0,
    Math.min(
      100,
      getNumber(value)
    )
  );
}

function getStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string"
  );
}

function getRecord(
  value: unknown
): Record<string, unknown> {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function cleanJsonResponse(
  text: string
): string {
  let cleaned =
    text.trim();

  if (
    cleaned.startsWith("```")
  ) {
    cleaned = cleaned.replace(
      /^```(?:json)?\s*/i,
      ""
    );

    cleaned = cleaned.replace(
      /\s*```$/,
      ""
    );
  }

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace >= firstBrace
  ) {
    return cleaned.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return cleaned;
}

function parseAnalysis(
  text: string
): ScriptAnalysis {
  let parsed: unknown;

  try {
    parsed = JSON.parse(
      cleanJsonResponse(text)
    );
  } catch {
    throw new Error(
      "AI returned an invalid screenplay analysis."
    );
  }

  const data =
    getRecord(parsed);

  const screenplay =
    getRecord(
      data.screenplay
    );

  const story =
    getRecord(
      data.story
    );

  const dialogue =
    getRecord(
      data.dialogue
    );

  const spirituality =
    getRecord(
      data.spirituality
    );

  const culture =
    getRecord(
      data.culture
    );

  const professional =
    getRecord(
      data.professional
    );

  const production =
    getRecord(
      data.production
    );

  const rawCharacters =
    Array.isArray(
      data.characters
    )
      ? data.characters
      : [];

  const rawScenes =
    Array.isArray(
      data.scenes
    )
      ? data.scenes
      : [];

  return {
    screenplay: {
      title:
        getString(
          screenplay.title
        ),

      pages:
        Math.max(
          0,
          getNumber(
            screenplay.pages
          )
        ),

      acts:
        Math.max(
          0,
          getNumber(
            screenplay.acts
          )
        ),

      scenes:
        Math.max(
          0,
          getNumber(
            screenplay.scenes
          )
        ),

      format:
        getString(
          screenplay.format
        ),
    },

    story: {
      genre:
        getString(
          story.genre
        ),

      theme:
        getString(
          story.theme
        ),

      logline:
        getString(
          story.logline
        ),

      synopsis:
        getString(
          story.synopsis
        ),

      strengths:
        getStringArray(
          story.strengths
        ),

      weaknesses:
        getStringArray(
          story.weaknesses
        ),

      recommendations:
        getStringArray(
          story.recommendations
        ),
    },

    characters:
      rawCharacters
        .map((item) => {
          const character =
            getRecord(item);

          return {
            name:
              getString(
                character.name
              ),

            role:
              getString(
                character.role
              ),

            arc:
              getString(
                character.arc
              ),

            consistency:
              getScore(
                character.consistency
              ),

            notes:
              getStringArray(
                character.notes
              ),
          };
        })
        .filter(
          (character) =>
            character.name ||
            character.role
        ),

    scenes:
      rawScenes
        .map(
          (
            item,
            index
          ) => {
            const scene =
              getRecord(item);

            const number =
              getNumber(
                scene.number
              );

            return {
              number:
                number > 0
                  ? number
                  : index + 1,

              heading:
                getString(
                  scene.heading
                ),

              purpose:
                getString(
                  scene.purpose
                ),

              notes:
                getStringArray(
                  scene.notes
                ),
            };
          }
        )
        .filter(
          (scene) =>
            scene.heading ||
            scene.purpose ||
            scene.notes.length > 0
        ),

    dialogue: {
      score:
        getScore(
          dialogue.score
        ),

      strengths:
        getStringArray(
          dialogue.strengths
        ),

      improvements:
        getStringArray(
          dialogue.improvements
        ),
    },

    spirituality: {
      biblicalAlignment:
        getScore(
          spirituality
            .biblicalAlignment
        ),

      kingdomMessage:
        getString(
          spirituality
            .kingdomMessage
        ),

      scriptureReferences:
        getStringArray(
          spirituality
            .scriptureReferences
        ),

      recommendations:
        getStringArray(
          spirituality
            .recommendations
        ),
    },

    culture: {
      country:
        getString(
          culture.country
        ),

      culture:
        getString(
          culture.culture
        ),

      language:
        getString(
          culture.language
        ),

      authenticity:
        getScore(
          culture.authenticity
        ),

      recommendations:
        getStringArray(
          culture.recommendations
        ),
    },

    professional: {
      score:
        getScore(
          professional.score
        ),

      screenplayFormat:
        getStringArray(
          professional
            .screenplayFormat
        ),

      industryJargon:
        getStringArray(
          professional
            .industryJargon
        ),

      continuity:
        getStringArray(
          professional
            .continuity
        ),

      clarity:
        getStringArray(
          professional.clarity
        ),

      recommendations:
        getStringArray(
          professional
            .recommendations
        ),
    },

    production: {
      budget:
        getString(
          production.budget
        ),

      complexity:
        getString(
          production.complexity
        ),

      risks:
        getStringArray(
          production.risks
        ),

      recommendations:
        getStringArray(
          production
            .recommendations
        ),
    },
  };
}

function isSeverity(
  value: unknown
): value is ScriptReviewSeverity {
  return (
    value === "info" ||
    value === "suggestion" ||
    value === "important" ||
    value === "critical"
  );
}

function parseReview(
  text: string,
  requestedType: ScriptReviewType
): ScriptReview {
  let parsed: unknown;

  try {
    parsed = JSON.parse(
      cleanJsonResponse(text)
    );
  } catch {
    throw new Error(
      "AI returned an invalid screenplay review."
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "AI returned an invalid screenplay review."
    );
  }

  const data =
    parsed as Record<
      string,
      unknown
    >;

  const rawIssues =
    Array.isArray(data.issues)
      ? data.issues
      : [];

  const issues: ScriptReviewIssue[] =
    rawIssues
      .filter(
        (
          item
        ): item is Record<
          string,
          unknown
        > =>
          typeof item === "object" &&
          item !== null &&
          !Array.isArray(item)
      )
      .map(
        (
          item,
          index
        ) => ({
          id:
            typeof item.id ===
            "string"
              ? item.id
              : `${requestedType}-${index + 1}`,

          type: requestedType,

          severity:
            isSeverity(
              item.severity
            )
              ? item.severity
              : "suggestion",

          title:
            typeof item.title ===
            "string"
              ? item.title
              : "Review suggestion",

          description:
            typeof item.description ===
            "string"
              ? item.description
              : "",

          originalText:
            typeof item.originalText ===
            "string"
              ? item.originalText
              : undefined,

          suggestedText:
            typeof item.suggestedText ===
            "string"
              ? item.suggestedText
              : undefined,

          reason:
            typeof item.reason ===
            "string"
              ? item.reason
              : undefined,

          scene:
            typeof item.scene ===
            "number"
              ? item.scene
              : undefined,
        })
      );

  const rawScore =
    typeof data.score === "number"
      ? data.score
      : 0;

  return {
    type: requestedType,

    summary:
      typeof data.summary ===
      "string"
        ? data.summary
        : "Screenplay review completed.",

    score:
      Math.max(
        0,
        Math.min(
          100,
          rawScore
        )
      ),

    issues,

    createdAt:
      new Date().toISOString(),
  };
}

export class ScriptIntelligenceService {
  async analyze(
    screenplay: string
  ): Promise<ScriptAnalysis> {
    if (!screenplay.trim()) {
      return createEmptyAnalysis();
    }

    const response =
      await aiGateway.generate({
        provider:
          "openrouter",

        systemPrompt:
          scriptAnalysisPrompt
            .buildSystemPrompt(),

        userPrompt:
          scriptAnalysisPrompt
            .buildUserPrompt(
              screenplay
            ),

        temperature: 0.2,

        maxTokens: 6000,
      });

    return parseAnalysis(
      response.text
    );
  }

  async review(
    screenplay: string,
    type: ScriptReviewType
  ): Promise<ScriptReview> {
    if (!screenplay.trim()) {
      throw new Error(
        "Screenplay content is required for review."
      );
    }

    const response =
      await aiGateway.generate({
        provider:
          "openrouter",

        systemPrompt:
          scriptReviewPrompt
            .buildSystemPrompt(
              type
            ),

        userPrompt:
          scriptReviewPrompt
            .buildUserPrompt(
              screenplay
            ),

        temperature: 0.3,

        maxTokens: 4000,
      });

    return parseReview(
      response.text,
      type
    );
  }
}

export const scriptIntelligence =
  new ScriptIntelligenceService();