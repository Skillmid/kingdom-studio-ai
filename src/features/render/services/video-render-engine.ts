import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { open, stat, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, isAbsolute, join } from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

import type { ExportManifest, ExportManifestClip, RenderClipSourceKind } from "../types/render";

export interface VideoClipInput {
  sequenceNumber: number;
  title?: string;
  mediaUrl?: string;
  inputFormat?: "mp4" | "mov" | "webm" | "matroska";
  durationSeconds: number;
  sourceKind: RenderClipSourceKind;
  sourceId?: string;
  uncertaintyNotes?: string;
}

export interface VideoRenderConfig {
  width?: number;
  height?: number;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  timeoutMs?: number;
  threads?: number;
}

export interface VideoRenderResult {
  success: boolean;
  outputFilePath?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  format: "mp4";
  clipCount: number;
  error?: string;
  warnings: string[];
  commandExecuted?: string;
  renderedAt: string;
}

export type ProcessRunner = (
  command: string,
  args: string[],
  options: {
    timeout?: number;
    signal?: AbortSignal;
    onProgress?: (fraction: number) => void;
    scratchDirectory?: string;
    inputFilePath?: string;
  }
) => Promise<{ stdout: string; stderr: string; exitCode: number }>;

export interface VideoProbeResult {
  formatNames: string;
  durationSeconds: number;
  hasVideo: boolean;
}

export type VideoProbe = (
  filePath: string,
  ffprobePath: string,
  timeoutMs: number,
) => Promise<VideoProbeResult>;

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_FPS = 24;
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_PROCESS_OUTPUT_BYTES = 10 * 1024 * 1024;
const execFileAsync = promisify(execFile);

function appendBounded(current: string, chunk: string): string {
  const remaining = MAX_PROCESS_OUTPUT_BYTES - Buffer.byteLength(current);
  if (remaining <= 0) return current;
  return current + Buffer.from(chunk).subarray(0, remaining).toString("utf8");
}

export function resolveFFmpegPath(customPath?: string): string {
  if (customPath && customPath.trim().length > 0) {
    return customPath.trim();
  }
  if (process.env["FFMPEG_PATH"] && process.env["FFMPEG_PATH"].trim().length > 0) {
    return process.env["FFMPEG_PATH"].trim();
  }
  return "ffmpeg";
}

export const defaultVideoProbe: VideoProbe = async (filePath, ffprobePath, timeoutMs) => {
  const { stdout } = await execFileAsync(ffprobePath, [
    "-v", "error",
    "-show_entries", "format=format_name,duration:stream=codec_type",
    "-of", "json",
    filePath,
  ], { timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024 });
  const result: unknown = JSON.parse(String(stdout));
  if (!result || typeof result !== "object") throw new Error("FFprobe returned invalid media metadata.");
  const record = result as {
    format?: { format_name?: unknown; duration?: unknown };
    streams?: Array<{ codec_type?: unknown }>;
  };
  const formatNames = typeof record.format?.format_name === "string" ? record.format.format_name : "";
  const durationSeconds = Number(record.format?.duration);
  const hasVideo = Array.isArray(record.streams)
    && record.streams.some((stream) => stream.codec_type === "video");
  return { formatNames, durationSeconds, hasVideo };
};

export const defaultProcessRunner: ProcessRunner = (
  command: string,
  args: string[],
  options: {
    timeout?: number;
    signal?: AbortSignal;
    onProgress?: (fraction: number) => void;
    inputFilePath?: string;
  },
) =>
  new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: [options.inputFilePath ? "pipe" : "ignore", "pipe", "pipe"], signal: options.signal });
    let stdout = "";
    let stderr = "";
    let progressLines = "";
    let settled = false;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, options.timeout ?? DEFAULT_TIMEOUT_MS);
    const finish = (error?: Error, exitCode = 1) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else if (timedOut) {
        resolve({ stdout, stderr: `FFmpeg timed out after ${options.timeout ?? DEFAULT_TIMEOUT_MS} ms.`, exitCode: 124 });
      } else {
        resolve({ stdout, stderr, exitCode });
      }
    };

    if (!child.stdout || !child.stderr) {
      child.kill();
      finish(new Error("FFmpeg process output streams could not be initialized."));
      return;
    }

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout = appendBounded(stdout, chunk);
      progressLines += chunk;
      const lines = progressLines.split(/\r?\n/);
      progressLines = lines.pop() ?? "";
      for (const line of lines) {
        const [key, value] = line.split("=");
        if (key !== "out_time_us" || !value) continue;
        const seconds = Number(value) / 1_000_000;
        if (Number.isFinite(seconds)) options.onProgress?.(seconds);
      }
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr = appendBounded(stderr, chunk);
    });
    if (options.inputFilePath && child.stdin) {
      const input = createReadStream(options.inputFilePath);
      input.once("error", (error) => finish(error));
      child.stdin.once("error", (error: NodeJS.ErrnoException) => {
        if (error.code !== "EPIPE") finish(error);
      });
      input.pipe(child.stdin);
    }
    child.once("error", (error) => finish(error));
    child.once("close", (code) => finish(undefined, code ?? 1));
  });

/**
 * Validates that an output file exists, is non-empty, and possesses a valid MP4 container signature ('ftyp').
 */
export async function validateRenderedVideo(filePath: string): Promise<{
  valid: boolean;
  sizeBytes: number;
  hasValidHeader: boolean;
  error?: string;
}> {
  try {
    const fileStats = await stat(filePath);
    if (fileStats.size === 0) {
      return { valid: false, sizeBytes: 0, hasValidHeader: false, error: "Output file is empty (0 bytes)." };
    }

    const fileHandle = await open(filePath, "r");
    try {
      const headerBuffer = Buffer.alloc(32);
      const { bytesRead } = await fileHandle.read(headerBuffer, 0, 32, 0);
      if (bytesRead < 8) {
        return { valid: false, sizeBytes: fileStats.size, hasValidHeader: false, error: "File too small for container header." };
      }

      // MP4 files start with a 4-byte size followed by 'ftyp' (0x66 0x74 0x79 0x70)
      const ftypMarker = headerBuffer.toString("latin1", 4, 8);
      const hasValidHeader = ftypMarker === "ftyp";

      if (!hasValidHeader) {
        return {
          valid: false,
          sizeBytes: fileStats.size,
          hasValidHeader: false,
          error: `Header missing MP4 'ftyp' atom; found '${ftypMarker}'.`,
        };
      }

      return { valid: true, sizeBytes: fileStats.size, hasValidHeader: true };
    } finally {
      await fileHandle.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, sizeBytes: 0, hasValidHeader: false, error: message };
  }
}

/**
 * Builds deterministic FFmpeg command arguments for assembling a timeline of clips.
 */
export function buildFFmpegRenderArgs(
  clips: VideoClipInput[],
  outputFilePath: string,
  config: VideoRenderConfig = {}
): { command: string; args: string[]; warnings: string[] } {
  const width = config.width ?? DEFAULT_WIDTH;
  const height = config.height ?? DEFAULT_HEIGHT;
  const fps = config.fps ?? DEFAULT_FPS;
  const threads = Math.max(1, Math.min(32, Math.floor(config.threads ?? 2)));
  const warnings: string[] = [];
  const ffmpegPath = resolveFFmpegPath(config.ffmpegPath);

  const args: string[] = ["-y", "-hide_banner"];
  const filterChains: string[] = [];
  const concatInputs: string[] = [];

  let inputIndex = 0;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const duration = Math.max(1, Math.round(clip.durationSeconds || 5));
    const media = clip.mediaUrl?.trim();

    if (!media) {
      warnings.push(`Clip ${clip.sequenceNumber} ('${clip.title ?? "Untitled"}') has no media; rendered synthetic slate.`);
      // Generate synthetic video color slate
      args.push("-f", "lavfi", "-i", `color=c=0x18181b:s=${width}x${height}:d=${duration}:r=${fps}`);
      // Generate synthetic silence audio
      args.push("-f", "lavfi", "-i", `anullsrc=channel_layout=stereo:sample_rate=44100:d=${duration}`);

      filterChains.push(`[${inputIndex}:v]setsar=1,fps=${fps}[v${i}]`);
      filterChains.push(`[${inputIndex + 1}:a]aformat=channel_layouts=stereo:sample_rates=44100[a${i}]`);

      concatInputs.push(`[v${i}][a${i}]`);
      inputIndex += 2;
    } else {
      if (!isAbsolute(media)) {
        throw new Error("Render engine accepts only downloaded local media files; remote URLs are not permitted.");
      }
      const format = clip.inputFormat ?? ({
        ".mp4": "mp4",
        ".m4v": "mp4",
        ".mov": "mov",
        ".webm": "webm",
        ".mkv": "matroska",
      } as const)[extname(media).toLowerCase() as ".mp4" | ".m4v" | ".mov" | ".webm" | ".mkv"];
      if (!format) throw new Error("Render engine received an unsupported local media file type.");
      args.push("-protocol_whitelist", "file", "-f", format, "-i", media);
      // Audio generator as safety fallback for mute clips
      args.push("-f", "lavfi", "-i", `anullsrc=channel_layout=stereo:sample_rate=44100:d=${duration}`);

      filterChains.push(
        `[${inputIndex}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},trim=duration=${duration}[v${i}]`
      );
      filterChains.push(`[${inputIndex + 1}:a]aformat=channel_layouts=stereo:sample_rates=44100[a${i}]`);

      concatInputs.push(`[v${i}][a${i}]`);
      inputIndex += 2;
    }
  }

  // Concatenate all normalized video and audio pairs
  const concatFilter = `${concatInputs.join("")}concat=n=${clips.length}:v=1:a=1[outv][outa]`;
  filterChains.push(concatFilter);

  args.push("-filter_complex", filterChains.join(";"));
  args.splice(args.indexOf("-filter_complex"), 0, "-filter_complex_threads", String(threads));
  args.push(
    "-progress",
    "pipe:1",
    "-nostats",
    "-map",
    "[outv]",
    "-map",
    "[outa]",
    "-c:v",
    config.videoCodec ?? "libx264",
    "-threads",
    String(threads),
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    config.audioCodec ?? "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputFilePath
  );

  return { command: ffmpegPath, args, warnings };
}

/**
 * Assembles an array of clips into a playable MP4 video file.
 */
export async function renderVideoAssembly(
  clips: VideoClipInput[],
  outputFilePath: string,
  options: {
    config?: VideoRenderConfig;
    runner?: ProcessRunner;
    probe?: VideoProbe;
    signal?: AbortSignal;
    onProgress?: (fraction: number) => void;
    scratchDirectory?: string;
  } = {}
): Promise<VideoRenderResult> {
  const renderedAt = new Date().toISOString();

  if (!clips || clips.length === 0) {
    return {
      success: false,
      format: "mp4",
      clipCount: 0,
      error: "No clips provided for rendering.",
      warnings: [],
      renderedAt,
    };
  }

  const sortedClips = [...clips].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const totalDuration = sortedClips.reduce((sum, c) => sum + Math.max(1, Math.round(c.durationSeconds || 5)), 0);

  const { command, warnings } = buildFFmpegRenderArgs(sortedClips, outputFilePath, options.config);

  await mkdir(dirname(outputFilePath), { recursive: true });

  const runner = options.runner ?? defaultProcessRunner;
  const timeoutMs = options.config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const scratchDirectory = await mkdtemp(join(options.scratchDirectory ?? tmpdir(), `kingdom-render-${randomUUID()}-`));
  const normalizedClips: VideoClipInput[] = [];
  const executedCommands: string[] = [];
  try {
    for (const [index, clip] of sortedClips.entries()) {
      const normalizedPath = join(scratchDirectory, `clip-${index}.mp4`);
      const threads = Math.max(1, Math.min(32, Math.floor(options.config?.threads ?? 2)));
      const normalizedArgs: string[] = [
        "-y", "-hide_banner",
        "-filter_threads", String(threads),
        "-threads", String(threads),
        "-progress", "pipe:1", "-nostats",
      ];
      let inputDuration: number;
      if (clip.mediaUrl) {
        if (!isAbsolute(clip.mediaUrl)) {
          throw new Error("Render engine accepts only downloaded local media files; remote URLs are not permitted.");
        }
        const format = clip.inputFormat ?? ({
          ".mp4": "mp4",
          ".m4v": "mp4",
          ".mov": "mov",
          ".webm": "webm",
          ".mkv": "matroska",
        } as const)[extname(clip.mediaUrl).toLowerCase() as ".mp4" | ".m4v" | ".mov" | ".webm" | ".mkv"];
        if (!format) throw new Error("Render engine received an unsupported local media file type.");
        normalizedArgs.push("-protocol_whitelist", "pipe", "-f", format, "-i", "pipe:0");
        inputDuration = Math.max(1, Math.round(clip.durationSeconds || 5));
      } else {
        const duration = Math.max(1, Math.round(clip.durationSeconds || 5));
        normalizedArgs.push(
          "-f", "lavfi", "-i", `color=c=0x18181b:s=${options.config?.width ?? DEFAULT_WIDTH}x${options.config?.height ?? DEFAULT_HEIGHT}:d=${duration}:r=${options.config?.fps ?? DEFAULT_FPS}`,
        );
        inputDuration = duration;
      }

      normalizedArgs.push(
        "-map", "0:v:0",
        "-vf", `scale=${options.config?.width ?? DEFAULT_WIDTH}:${options.config?.height ?? DEFAULT_HEIGHT}:force_original_aspect_ratio=decrease,pad=${options.config?.width ?? DEFAULT_WIDTH}:${options.config?.height ?? DEFAULT_HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${options.config?.fps ?? DEFAULT_FPS},trim=duration=${inputDuration}`,
        "-an",
        "-c:v", options.config?.videoCodec ?? "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", options.config?.audioCodec ?? "aac",
        "-b:a", "128k",
        "-t", String(inputDuration),
        "-movflags", "+faststart",
        normalizedPath,
      );
      executedCommands.push(`${command} ${normalizedArgs.join(" ")}`);
      const executionResult = await runner(command, normalizedArgs, {
        timeout: timeoutMs,
        signal: options.signal,
        inputFilePath: clip.mediaUrl,
        onProgress: (seconds) => {
          const completedDuration = sortedClips.slice(0, index).reduce(
            (total, previous) => total + Math.max(1, Math.round(previous.durationSeconds || 5)),
            0,
          );
          options.onProgress?.(Math.min(0.99, (completedDuration + seconds) / totalDuration));
        },
      });
      if (executionResult.exitCode !== 0) {
        return {
          success: false,
          format: "mp4",
          clipCount: sortedClips.length,
          error: `FFmpeg rendering failed with exit code ${executionResult.exitCode}: ${executionResult.stderr}`,
          warnings,
          commandExecuted: executedCommands.join("\n"),
          renderedAt,
        };
      }
      normalizedClips.push({ ...clip, mediaUrl: normalizedPath, inputFormat: "mp4" });
    }

    const { args } = buildFFmpegRenderArgs(normalizedClips, outputFilePath, options.config);
    args.unshift("-protocol_whitelist", "file,pipe");
    executedCommands.push(`${command} ${args.join(" ")}`);
    const finalResult = await runner(command, args, {
      timeout: timeoutMs,
      signal: options.signal,
      onProgress: (seconds) => options.onProgress?.(Math.min(0.99, seconds / totalDuration)),
    });
    if (finalResult.exitCode !== 0) {
      return {
        success: false,
        format: "mp4",
        clipCount: sortedClips.length,
        error: `FFmpeg rendering failed with exit code ${finalResult.exitCode}: ${finalResult.stderr}`,
        warnings,
        commandExecuted: executedCommands.join("\n"),
        renderedAt,
      };
    }
  } finally {
    await rm(scratchDirectory, { recursive: true, force: true });
  }

  const validation = await validateRenderedVideo(outputFilePath);
  if (!validation.valid) {
    return {
      success: false,
      outputFilePath,
      format: "mp4",
      clipCount: sortedClips.length,
      error: `Render output validation failed: ${validation.error}`,
      warnings,
      commandExecuted: `${command} final-output-validation`,
      renderedAt,
    };
  }
  let probe: VideoProbeResult;
  try {
    probe = await (options.probe ?? defaultVideoProbe)(
      outputFilePath,
      options.config?.ffprobePath ?? process.env["FFPROBE_PATH"] ?? "ffprobe",
      timeoutMs,
    );
  } catch (error) {
    return {
      success: false,
      outputFilePath,
      format: "mp4",
      clipCount: sortedClips.length,
      error: `FFprobe could not validate the rendered media: ${error instanceof Error ? error.message : String(error)}`,
      warnings,
      renderedAt,
    };
  }
  if (!probe.formatNames.split(",").includes("mp4") || !probe.hasVideo || !Number.isFinite(probe.durationSeconds) || probe.durationSeconds <= 0) {
    return {
      success: false,
      outputFilePath,
      format: "mp4",
      clipCount: sortedClips.length,
      error: "FFprobe validation failed: output must contain a playable MP4 format and video stream.",
      warnings,
      renderedAt,
    };
  }

  return {
    success: true,
    outputFilePath,
    fileSizeBytes: validation.sizeBytes,
    durationSeconds: probe.durationSeconds,
    width: options.config?.width ?? DEFAULT_WIDTH,
    height: options.config?.height ?? DEFAULT_HEIGHT,
    format: "mp4",
    clipCount: sortedClips.length,
    warnings,
    commandExecuted: `${command} ${sortedClips.length} isolated input(s)`,
    renderedAt,
  };
}

/**
 * Converts an existing ExportManifest into a playable MP4 video file.
 */
export async function renderExportManifest(
  manifest: ExportManifest,
  outputFilePath: string,
  options: {
    config?: VideoRenderConfig;
    runner?: ProcessRunner;
    probe?: VideoProbe;
  } = {}
): Promise<VideoRenderResult> {
  const clips: VideoClipInput[] = manifest.clips.map((clip: ExportManifestClip) => ({
    sequenceNumber: clip.sequenceNumber,
    title: clip.title,
    mediaUrl: clip.mediaUrl,
    durationSeconds: clip.durationSeconds ?? 5,
    sourceKind: clip.sourceKind,
    sourceId: clip.sourceId,
    uncertaintyNotes: clip.uncertaintyNotes,
  }));

  return renderVideoAssembly(clips, outputFilePath, options);
}
