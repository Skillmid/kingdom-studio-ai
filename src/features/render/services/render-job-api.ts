"use client";

import { supabase } from "@/lib/supabase/client";
import type { VideoRenderJob } from "../types/video-render-job";

interface ApiError {
  error?: unknown;
}

export async function renderJobApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Unable to verify your session: ${error.message}`);
  const accessToken = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Render service returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const apiError = payload as ApiError;
    throw new Error(
      typeof apiError.error === "string"
        ? apiError.error
        : `Render request failed (HTTP ${response.status}).`,
    );
  }
  return payload as T;
}

export function getRenderPlaybackUrl(url: string): string {
  if ((!url.startsWith("/") || url.startsWith("//")) && !url.startsWith("https://")) {
    throw new Error("The render service returned an unsupported playback URL.");
  }
  return url;
}

export interface RenderJobsResponse {
  jobs: VideoRenderJob[];
}

export interface RenderJobResponse {
  job: VideoRenderJob;
  signedPlaybackUrl?: string;
  expiresAt?: string;
}
