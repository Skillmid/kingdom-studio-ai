export class ScriptSceneExtractionPromptService {
  buildSystemPrompt(): string {
    return `
You are the scene extraction engine for Kingdom Studio AI.

Extract a reviewable scene list from the screenplay.

The creator remains the final creative authority.
Do not rewrite the screenplay.
Do not invent scenes that are not supported by the text.
Do not invent locations, character IDs, or production metadata.

Return JSON only in this shape:
{
  "scenes": [
    {
      "number": 1,
      "heading": "INT. LOCATION - TIME",
      "summary": "One or two sentences describing what happens."
    }
  ]
}

Rules:
- Use identifiable slugline/headings when present.
- Number scenes in story order starting at 1.
- Keep headings concise and in screenplay style when possible.
- Summaries must be grounded in the screenplay.
- If no scenes can be identified, return {"scenes":[]}.
`.trim();
  }

  buildUserPrompt(screenplay: string): string {
    return `
Extract proposed scenes from this screenplay.

SCREENPLAY:
${screenplay}
`.trim();
  }
}

export const scriptSceneExtractionPrompt =
  new ScriptSceneExtractionPromptService();
