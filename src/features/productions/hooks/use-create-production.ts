"use client";

import { useState } from "react";

import { createProduction } from "../services/create-production";

export function useCreateProduction() {
  const [loading, setLoading] = useState(false);

  async function create(title: string) {
    setLoading(true);

    try {
      const production = await createProduction(title);

      return {
        success: true,
        production,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create production.",
      };
    } finally {
      setLoading(false);
    }
  }

  return {
    create,
    loading,
  };
}