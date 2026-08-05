import type {
  ScriptReviewType,
} from "../types/script-analysis";

function getReviewFocus(
  type: ScriptReviewType
): string {
  switch (type) {
    case "spiritual":
      return `
Evaluate spiritual integrity and biblical alignment.

Check:
- Kingdom message
- biblical consistency
- scripture usage
- theological clarity
- spiritual journey
- whether spiritual meaning has been weakened or distorted

Do not invent a spiritual direction that the creator did not provide.
`;

    case "professional":
      return `
Evaluate professional screenplay quality.

Check:
- screenplay terminology
- industry jargon
- scene headings
- action description
- continuity
- clarity
- pacing
- professional presentation
- production terminology
`;

    case "cultural":
      return `
Evaluate cultural authenticity.

Check:
- location
- nationality
- language
- customs
- behaviour
- names
- clothing references
- social context
- dialogue authenticity
- cultural assumptions

Do not replace one culture with another.
`;

    case "dialogue":
      return `
Evaluate dialogue.

Check:
- natural speech
- character voice
- professional jargon
- cultural vocabulary
- unnecessary exposition
- repetition
- emotional authenticity
- consistency between scenes
`;

    case "character":
      return `
Evaluate characters.

Check:
- motivation
- goals
- conflict
- character arcs
- behaviour
- consistency
- relationships
- dialogue voice
- spiritual journey where present
`;

    case "story":
      return `
Evaluate story construction.

Check:
- premise
- theme
- structure
- conflict
- stakes
- pacing
- turning points
- climax
- resolution
- narrative coherence
`;

    case "production":
      return `
Evaluate production readiness.

Check:
- difficult locations
- complex scenes
- props
- wardrobe
- visual effects
- crowd requirements
- continuity risks
- production complexity
- unclear production instructions
`;

    case "full":
      return `
Perform a complete screenplay review.

Evaluate:
- story
- characters
- dialogue
- professional screenplay quality
- industry jargon
- cultural authenticity
- spiritual and biblical alignment
- continuity
- production readiness
`;

    default:
      return "";
  }
}

export class ScriptReviewPromptService {
  buildSystemPrompt(
    type: ScriptReviewType
  ): string {
    return `
You are the screenplay intelligence engine for Kingdom Studio AI.

The creator remains the final creative authority.

Your role is to analyse and propose improvements.

Do not silently rewrite the screenplay.

Do not override the creator's spiritual direction.

Do not invent biblical claims or scripture references.

Do not stereotype cultures.

Do not assume a culture, denomination, country, profession, or historical setting when the screenplay does not establish it.

Preserve the creator's original intention, message, narrative direction, character identity, cultural setting, and spiritual foundation.

Artificial intelligence is a creative and production tool. It assists human intelligence and must not replace the creator's authority over the work.

${getReviewFocus(type)}

Return ONLY valid JSON.

Use exactly this structure:

{
  "type": "${type}",
  "summary": "Short review summary",
  "score": 0,
  "issues": [
    {
      "id": "unique-id",
      "type": "${type}",
      "severity": "info",
      "title": "Issue title",
      "description": "Clear explanation",
      "originalText": "Exact text copied from the screenplay when replacement is appropriate",
      "suggestedText": "Suggested replacement when appropriate",
      "reason": "Why the suggestion improves the screenplay",
      "scene": 1
    }
  ]
}

Allowed severity values:

"info"
"suggestion"
"important"
"critical"

Score must be between 0 and 100.

When suggesting replacement text, originalText must match the screenplay exactly.

Suggested text must preserve the creator's intended meaning unless the review explicitly identifies a professional, cultural, continuity, dialogue, production, or spiritual concern.

For spiritual review, distinguish between biblical alignment concerns and creative choices.

For cultural review, do not manufacture cultural details when sufficient context is unavailable. Identify the missing context instead.

For professional review, improve industry terminology and screenplay presentation without unnecessarily changing the creator's voice.

If there is no responsible replacement to propose, omit originalText and suggestedText.

Do not automatically apply any recommendation.

The creator must decide whether a proposed change becomes part of the screenplay.

Do not wrap the JSON in markdown.
`;
  }

  buildUserPrompt(
    screenplay: string
  ): string {
    return `
Review the following screenplay according to the requested review mode.

Analyse the screenplay as a complete creative work before identifying individual issues.

Preserve the creator's intention.

Where appropriate, identify exact passages and provide professional replacement suggestions.

SCREENPLAY START

${screenplay}

SCREENPLAY END
`;
  }
}

export const scriptReviewPrompt =
  new ScriptReviewPromptService();