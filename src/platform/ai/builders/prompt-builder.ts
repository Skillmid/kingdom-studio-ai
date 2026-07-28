import type {
  ProductionContext,
} from "@/features/production-knowledge";

export class PromptBuilder {

  build(
    context: ProductionContext,
    prompt: string
  ) {

    return `
${context.system}

Production:
${context.production.title}

Story Theme:
${context.storyBible.theme}

Scripture:
${context.storyBible.scriptureFoundation}

Kingdom Vision:
${context.storyBible.kingdomVision}

User Request:
${prompt}
`;

  }

}

export const promptBuilder =
  new PromptBuilder();