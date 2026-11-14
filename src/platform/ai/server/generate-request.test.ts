import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  MAX_COMPLETION_TOKENS,
  MAX_USER_PROMPT_CHARS,
  parseAIGenerateRequest,
  resolveAllowedGeminiModel,
  resolveAllowedModel,
  upstreamErrorStatus,
} from "./generate-request";

const productionId = "55555555-5555-4555-8555-555555555555";

describe("AI generate request validation", () => {
  it("requires a valid productionId", () => {
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi" }).ok, false);
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId: "not-a-uuid" }).ok, false);
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId }).ok, true);
  });

  it("rejects empty prompts, oversized prompts and unbounded completions", () => {
    assert.equal(parseAIGenerateRequest({ userPrompt: "   ", productionId }).ok, false);
    assert.equal(parseAIGenerateRequest({ userPrompt: "x".repeat(MAX_USER_PROMPT_CHARS + 1), productionId }).ok, false);
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId, maxTokens: MAX_COMPLETION_TOKENS + 1 }).ok, false);
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId, temperature: 3 }).ok, false);
  });

  it("accepts only the implemented text providers", () => {
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId, provider: "openrouter" }).ok, true);
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId, provider: "gemini" }).ok, true);
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId, responseFormat: "json" }).ok, true);
    assert.equal(parseAIGenerateRequest({ userPrompt: "Hi", productionId, responseFormat: "xml" }).ok, false);
    const unsupported = parseAIGenerateRequest({ userPrompt: "Hi", productionId, provider: "openai" });
    assert.equal(unsupported.ok, false);
    if (!unsupported.ok) assert.match(unsupported.error, /^provider:/);
  });

  it("only allows default or server-configured OpenRouter models", () => {
    assert.deepEqual(resolveAllowedModel(undefined, {}), { ok: true, model: DEFAULT_OPENROUTER_MODEL });
    assert.equal(resolveAllowedModel("vendor/expensive-model", {}).ok, false);
    assert.deepEqual(resolveAllowedModel(undefined, { OPENROUTER_MODEL: "a/b" }), { ok: true, model: "a/b" });
    assert.deepEqual(resolveAllowedModel("c/d", { OPENROUTER_ALLOWED_MODELS: "x/y, c/d" }), { ok: true, model: "c/d" });
  });

  it("only allows default or server-configured Gemini models", () => {
    assert.deepEqual(resolveAllowedGeminiModel(undefined, {}), { ok: true, model: DEFAULT_GEMINI_MODEL });
    assert.equal(resolveAllowedGeminiModel("gemini-unapproved", {}).ok, false);
    assert.deepEqual(resolveAllowedGeminiModel(undefined, { GEMINI_MODEL: "gemini-custom" }), { ok: true, model: "gemini-custom" });
    assert.deepEqual(resolveAllowedGeminiModel("gemini-allowed", { GEMINI_ALLOWED_MODELS: "gemini-other, gemini-allowed" }), { ok: true, model: "gemini-allowed" });
  });

  it("never forwards an upstream 401/403 as the caller's auth failure", () => {
    assert.equal(upstreamErrorStatus(401), 502);
    assert.equal(upstreamErrorStatus(403), 502);
    assert.equal(upstreamErrorStatus(429), 429);
    assert.equal(upstreamErrorStatus(504), 504);
  });
});
