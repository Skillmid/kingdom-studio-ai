import type { AIAction } from "../types/ai";

export class PromptBuilder {
  static build(
    action: AIAction,
    context: string,
    content: string
  ) {
    switch (action) {
      case "generate":
        return `
${context}

Generate high-quality content.

${content}
`;

      case "rewrite":
        return `
${context}

Rewrite the following while preserving its meaning.

${content}
`;

      case "expand":
        return `
${context}

Expand the following into a richer and more detailed version.

${content}
`;

      case "improve":
        return `
${context}

Improve the writing quality while preserving the author's intent.

${content}
`;

      case "summarize":
        return `
${context}

Summarize the following.

${content}
`;

      default:
        return content;
    }
  }
}