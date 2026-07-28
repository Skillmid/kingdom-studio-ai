import {
  importEngine,
  knowledgeExtractionService,
} from "@/features/import-engine";

import {
  contextEngine,
} from "@/features/production-knowledge";

import {
  scriptIntelligence,
} from "./script-intelligence.service";

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

  analysis: ScriptAnalysis;
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

    const context =
      contextEngine.create(
        extracted.knowledge
      );

    const analysis =
      await scriptIntelligence.analyze(
        imported.screenplay
      );

    void context;

    return {
      screenplay:
        imported.screenplay,

      knowledge:
        extracted.knowledge,

      analysis,
    };
  }
}

export const scriptPipeline =
  new ScriptPipelineService();