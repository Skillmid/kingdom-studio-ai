import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacterAISyncService } from "./character-ai-sync.service";

it("generates an evidence-grounded proposal tied to the current screenplay revision", async () => {
  let request: { systemPrompt: string; userPrompt: string; productionId?: string } | undefined;
  const content = "INT. STATION - NIGHT\nAyo waits beneath the clock.\nAYO\nThe last train has left.";
  const service = createCharacterAISyncService({
    screenplayRepository: {
      getByProductionId: async () => ({ id: "script-1", title: "A Canvas in Rain", version: 3, content }),
      getRevisions: async () => [{ id: "revision-3", screenplayId: "script-1", version: 3, title: "A Canvas in Rain", content, reason: "manual-save", createdAt: "" }],
    },
    aiGateway: {
      generate: async (input: { systemPrompt: string; userPrompt: string; productionId?: string }) => {
        request = input;
        return { provider: "openrouter", text: JSON.stringify({ fields: { biography: "Ayo waits for the last train." }, fieldEvidence: { biography: "Ayo waits beneath the clock." } }) };
      },
    },
  });
  const proposal = await service.propose("production-1", { id: "character-1", productionId: "production-1", name: "Ayo", role: "supporting", status: "draft", progress: 0, references: [], createdAt: "", updatedAt: "" });
  assert.match(request?.userPrompt ?? "", /Ayo waits beneath the clock/);
  for (const screenplaySpecificName of ["Michael", "Esther", "Tunde", "Kunle", "THE MESSAGE"]) {
    assert.equal(request?.systemPrompt.includes(screenplaySpecificName), false);
  }
  assert.equal(request?.productionId, "production-1");
  assert.equal(proposal.fields.biography, "Ayo waits for the last train.");
  assert.equal(proposal.source.revisionId, "revision-3");
  assert.equal(proposal.source.screenplayVersion, 3);
});
