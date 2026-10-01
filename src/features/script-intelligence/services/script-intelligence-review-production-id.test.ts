import assert from "node:assert/strict";
import { it } from "node:test";
import { aiGateway } from "../../../platform/ai/services/ai-gateway";
import type { AIRequest, AIResponse } from "../../../platform/ai/types/ai-provider";
import { ScriptIntelligenceService } from "./script-intelligence.service";

it("forwards productionId with specialised screenplay review requests", async () => {
  const originalGenerate = aiGateway.generate;
  let capturedRequest: AIRequest | undefined;

  aiGateway.generate = async (request: AIRequest): Promise<AIResponse> => {
    capturedRequest = request;
    return {
      provider: "openrouter",
      text: JSON.stringify({ score: 86, summary: "Review complete.", issues: [] }),
    };
  };

  try {
    const result = await new ScriptIntelligenceService().review(
      "INT. STATION - NIGHT\nMAYA waits.",
      "story",
      "production-123",
    );

    assert.equal(capturedRequest?.productionId, "production-123");
    assert.equal(capturedRequest?.provider, "openrouter");
    assert.equal(result.type, "story");
  } finally {
    aiGateway.generate = originalGenerate;
  }
});