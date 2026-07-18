"use client";

import { useState } from "react";

import { aiService } from "../services/ai.service";

import type {
  AIAction,
  AIResponse,
} from "../types/ai";

interface GenerateOptions {
  action: AIAction;

  context: string;

  content: string;
}

export function useAI() {
  const [loading, setLoading] =
    useState(false);

  const [response, setResponse] =
    useState<AIResponse | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function generate({
    action,
    context,
    content,
  }: GenerateOptions) {
    try {
      setLoading(true);

      setError(null);

      const result =
        await aiService.generate({
          systemPrompt: context,

          userPrompt: content,
        });

      setResponse(result);

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown AI error.";

      setError(message);

      throw error;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResponse(null);

    setError(null);
  }

  return {
    loading,

    response,

    error,

    generate,

    reset,
  };
}