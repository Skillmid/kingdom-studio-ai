import { sceneSchema } from "@/features/scenes/validation/scene.schema";
import type { Scene, SceneCreateInput } from "@/features/scenes/types/scene";
import type { ProposedScene } from "../types/scene-proposal";
import {
  buildApprovedSceneInput,
  type SceneExtractionSource,
} from "./scene-extraction-provenance";

export interface SceneBatchWriter {
  createMany(scenes: SceneCreateInput[]): Promise<Scene[]>;
}

export async function persistApprovedSceneProposals(
  proposals: ProposedScene[],
  productionId: string,
  source: SceneExtractionSource | null,
  repository: SceneBatchWriter,
): Promise<Scene[]> {
  if (!productionId) {
    throw new Error("Production ID is required.");
  }

  const validated = proposals.map((proposal) => {
    const input = buildApprovedSceneInput(proposal, productionId, source);
    const result = sceneSchema.safeParse(input);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new Error(
        firstIssue?.message ??
          `Scene ${proposal.number} is not valid and was not saved.`,
      );
    }
    return result.data;
  });

  const numbers = new Set<number>();
  for (const scene of validated) {
    if (numbers.has(scene.number)) {
      throw new Error(`Scene number ${scene.number} is selected more than once.`);
    }
    numbers.add(scene.number);
  }

  return repository.createMany(validated);
}
