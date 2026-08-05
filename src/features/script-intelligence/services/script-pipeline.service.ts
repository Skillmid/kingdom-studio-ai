import {
  importEngine,
  knowledgeExtractionService,
} from "@/features/import-engine";

import {
  contextEngine,
} from "@/features/production-knowledge";

import type {
  ImportedFile,
} from "@/features/import-engine";

import type {
  ProductionKnowledge,
} from "@/features/production-knowledge";

import type {
  ScriptAnalysis,
} from "../types/script-analysis";

export interface ScriptPipelineResult {
  screenplay: string;

  knowledge: ProductionKnowledge;

  analysis: ScriptAnalysis | null;
}

export class ScriptPipelineService {
  async process(
    productionId: string,
    file: ImportedFile
  ): Promise<ScriptPipelineResult> {
    const imported =
      await importEngine.import(file);

    if (!imported.success) {
      throw new Error(
        imported.errors.join("\n") ||
          "Unable to import screenplay."
      );
    }

    const extracted =
      await knowledgeExtractionService.extract(
        productionId,
        imported.screenplay,
        file.type
      );

    /**
     * Build the production context.
     *
     * This prepares downstream AI features
     * such as Story Bible generation,
     * Character generation,
     * Storyboard,
     * AI Director,
     * Voice,
     * Render,
     * etc.
     */
    contextEngine.create(
      extracted.knowledge
    );

    /**
     * IMPORTANT
     *
     * Script Intelligence is now a
     * dedicated user action.
     *
     * Importing a screenplay should NOT
     * automatically consume AI credits.
     *
     * The creator decides when to analyse
     * or reanalyse the screenplay.
     */
    return {
      screenplay:
        imported.screenplay,

      knowledge:
        extracted.knowledge,

      analysis: null,
    };
  }
}

export const scriptPipeline =
  new ScriptPipelineService();