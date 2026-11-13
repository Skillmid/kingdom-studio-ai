import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";

import { buildExportManifest } from "./export-planner";
import {
  buildFFmpegRenderArgs,
  renderExportManifest,
  renderVideoAssembly,
  resolveFFmpegPath,
  validateRenderedVideo,
  type ProcessRunner,
  type VideoClipInput,
} from "./video-render-engine";
import { isPublicIpAddress, validatePublicMediaUrl } from "./secure-media";

const validProbe = (durationSeconds: number) => async () => ({
  formatNames: "mov,mp4,m4a,3gp,3g2,mj2",
  durationSeconds,
  hasVideo: true,
});
const ffprobePath = process.env["FFPROBE_PATH"] ?? "ffprobe";
let localMediaToolsAvailable = true;
try {
  execFileSync(resolveFFmpegPath(), ["-version"], { stdio: "ignore" });
  execFileSync(ffprobePath, ["-version"], { stdio: "ignore" });
} catch {
  localMediaToolsAvailable = false;
}

describe("Video Render Engine", () => {
  describe("secure media destination validation", () => {
    it("allows public addresses and rejects private or reserved DNS answers", async () => {
      assert.equal(isPublicIpAddress("8.8.8.8"), true);
      assert.equal(isPublicIpAddress("2606:4700:4700::1111"), true);
      assert.equal(isPublicIpAddress("169.254.1.1"), false);
      assert.equal(isPublicIpAddress("::ffff:127.0.0.1"), false);
      assert.equal(isPublicIpAddress("2001:db8::1"), false);

      await assert.rejects(
        validatePublicMediaUrl("https://media.example/video.mp4", async () => [
          { address: "8.8.8.8", family: 4 },
          { address: "10.0.0.4", family: 4 },
        ]),
        /private or reserved/,
      );
    });

    it("rejects unsafe schemes, credentials, nonstandard ports, and failed DNS", async () => {
      for (const url of [
        "http://media.example/video.mp4",
        "https://user:password@media.example/video.mp4",
        "https://media.example:8443/video.mp4",
      ]) {
        await assert.rejects(validatePublicMediaUrl(url), /HTTPS|credentials/);
      }
      await assert.rejects(
        validatePublicMediaUrl("https://media.example/video.mp4", async () => {
          throw new Error("ENOTFOUND");
        }),
        /hostname could not be resolved/,
      );
    });
  });

  describe("resolveFFmpegPath", () => {
    it("honors a custom provided executable path", () => {
      const custom = "C:\\custom\\ffmpeg.exe";
      assert.equal(resolveFFmpegPath(custom), custom);
    });

    it("falls back to standard path when no custom path is given", () => {
      const resolved = resolveFFmpegPath();
      assert.equal(resolved, "ffmpeg");
    });
  });

  describe("buildFFmpegRenderArgs", () => {
    it("builds filtergraph with synthetic slates for clips without media URLs", () => {
      const clips: VideoClipInput[] = [
        {
          sequenceNumber: 1,
          title: "Scene 1 - Dawn over Galilee",
          durationSeconds: 4,
          sourceKind: "scene",
        },
        {
          sequenceNumber: 2,
          title: "Scene 2 - The Gathering",
          durationSeconds: 6,
          sourceKind: "scene",
        },
      ];

      const { command, args, warnings } = buildFFmpegRenderArgs(clips, "C:\\tmp\\output.mp4", {
        width: 1920,
        height: 1080,
        fps: 24,
      });

      assert.ok(command.length > 0);
      assert.equal(warnings.length, 2);
      assert.match(warnings[0], /synthetic slate/);

      // Check faststart for web streaming and standard codecs
      assert.ok(args.includes("-movflags"));
      assert.ok(args.includes("+faststart"));
      assert.ok(args.includes("-pix_fmt"));
      assert.ok(args.includes("yuv420p"));
      assert.ok(args.includes("libx264"));
      assert.ok(args.includes("aac"));

      // Check complex filter has concat of both clips
      const filterArgIndex = args.indexOf("-filter_complex");
      assert.ok(filterArgIndex !== -1);
      const filter = args[filterArgIndex + 1];
      assert.match(filter, /concat=n=2:v=1:a=1/);
    });

    it("handles media clips by scaling, padding and trimming to target format", () => {
      const clips: VideoClipInput[] = [
        {
          sequenceNumber: 1,
          title: "Shot 1",
          mediaUrl: resolve(tmpdir(), "shot1.mp4"),
          inputFormat: "mp4",
          durationSeconds: 5,
          sourceKind: "shot",
        },
      ];

      const { args, warnings } = buildFFmpegRenderArgs(clips, "C:\\tmp\\output.mp4");
      assert.equal(warnings.length, 0);
      assert.ok(args.includes("-protocol_whitelist"));
      assert.ok(args.includes("file"));
      assert.ok(args.includes("-f"));
      assert.ok(args.includes("mp4"));

      const filterArgIndex = args.indexOf("-filter_complex");
      assert.ok(filterArgIndex !== -1);
      const filter = args[filterArgIndex + 1];
      assert.match(filter, /scale=1920:1080:force_original_aspect_ratio=decrease/);
      assert.match(filter, /trim=duration=5/);
    });

    it("rejects remote media URLs instead of passing them to FFmpeg", () => {
      assert.throws(() => buildFFmpegRenderArgs([
        {
          sequenceNumber: 1,
          mediaUrl: "https://media.example/movie.mp4",
          durationSeconds: 1,
          sourceKind: "scene",
        },
      ], resolve(tmpdir(), "output.mp4")), /only downloaded local media files/);
    });
  });

  describe("validateRenderedVideo", () => {
    it("validates valid MP4 container with ftyp atom", async () => {
      const dir = await mkdtemp(join(tmpdir(), "render-test-"));
      const filePath = join(dir, "sample.mp4");
      try {
        // Construct minimum ISO BMFF header: 4-byte size (0x00000020 = 32), 'ftyp', 'isom'
        const header = Buffer.alloc(64);
        header.writeUInt32BE(32, 0);
        header.write("ftyp", 4, "ascii");
        header.write("isom", 8, "ascii");

        await writeFile(filePath, header);

        const result = await validateRenderedVideo(filePath);
        assert.equal(result.valid, true);
        assert.equal(result.hasValidHeader, true);
        assert.equal(result.sizeBytes, 64);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });

    it("rejects 0-byte or corrupted non-MP4 files", async () => {
      const dir = await mkdtemp(join(tmpdir(), "render-test-"));
      const emptyPath = join(dir, "empty.mp4");
      const badPath = join(dir, "invalid.mp4");
      try {
        await writeFile(emptyPath, Buffer.alloc(0));
        await writeFile(badPath, Buffer.from("NOT AN MP4 CONTAINER AT ALL"));

        const emptyResult = await validateRenderedVideo(emptyPath);
        assert.equal(emptyResult.valid, false);
        assert.match(emptyResult.error ?? "", /empty/i);

        const badResult = await validateRenderedVideo(badPath);
        assert.equal(badResult.valid, false);
        assert.match(badResult.error ?? "", /missing MP4 'ftyp' atom/i);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });

  describe("renderVideoAssembly with runner injection", () => {
    it("returns error cleanly when no clips are supplied", async () => {
      const result = await renderVideoAssembly([], "C:\\tmp\\out.mp4");
      assert.equal(result.success, false);
      assert.match(result.error ?? "", /no clips provided/i);
    });

    it("surfaces execution errors when runner returns non-zero exit code", async () => {
      const mockRunner: ProcessRunner = async () => ({
        stdout: "",
        stderr: "Unrecognized option: -invalid_flag",
        exitCode: 1,
      });

      const clips: VideoClipInput[] = [
        { sequenceNumber: 1, durationSeconds: 3, sourceKind: "scene" },
      ];

      const result = await renderVideoAssembly(clips, "C:\\tmp\\fail.mp4", {
        runner: mockRunner,
      });

      assert.equal(result.success, false);
      assert.match(result.error ?? "", /FFmpeg rendering failed with exit code 1/);
      assert.match(result.error ?? "", /Unrecognized option/);
    });

    it("completes full workflow when runner generates valid video file", async () => {
      const dir = await mkdtemp(join(tmpdir(), "render-run-"));
      const targetPath = join(dir, "output.mp4");

      try {
        const mockRunner: ProcessRunner = async (_cmd, args) => {
          const outFile = args[args.length - 1];
          // Write synthetic valid MP4 file header
          const data = Buffer.alloc(128);
          data.writeUInt32BE(32, 0);
          data.write("ftyp", 4, "ascii");
          data.write("isom", 8, "ascii");
          await writeFile(outFile, data);
          return { stdout: "frame=72 fps=0.0", stderr: "", exitCode: 0 };
        };

        const clips: VideoClipInput[] = [
          { sequenceNumber: 1, title: "Opening", durationSeconds: 3, sourceKind: "scene" },
          { sequenceNumber: 2, title: "Climax", durationSeconds: 5, sourceKind: "scene" },
        ];

        const result = await renderVideoAssembly(clips, targetPath, {
          runner: mockRunner,
          probe: validProbe(8),
        });

        assert.equal(result.success, true);
        assert.equal(result.clipCount, 2);
        assert.equal(result.durationSeconds, 8);
        assert.equal(result.format, "mp4");
        assert.equal(result.fileSizeBytes, 128);
        assert.ok(result.outputFilePath);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });

    it("renders from an ExportManifest directly", async () => {
      const dir = await mkdtemp(join(tmpdir(), "render-manifest-"));
      const targetPath = join(dir, "manifest-render.mp4");

      try {
        const mockRunner: ProcessRunner = async (_cmd, args) => {
          const outFile = args[args.length - 1];
          const data = Buffer.alloc(128);
          data.writeUInt32BE(32, 0);
          data.write("ftyp", 4, "ascii");
          await writeFile(outFile, data);
          return { stdout: "", stderr: "", exitCode: 0 };
        };

        const manifest = buildExportManifest(
          "prod-123",
          [
            { sequenceNumber: 1, title: "Slate 1", durationSeconds: 4, sourceKind: "shot" },
            { sequenceNumber: 2, title: "Slate 2", durationSeconds: 6, sourceKind: "shot" },
          ],
          { id: "render-456", title: "Assembly sequence" }
        );

        const result = await renderExportManifest(manifest, targetPath, {
          runner: mockRunner,
          probe: validProbe(10),
        });

        assert.equal(result.success, true);
        assert.equal(result.clipCount, 2);
        assert.equal(result.durationSeconds, 10);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });

    it("streams multiple downloaded media inputs through FFmpeg and validates the MP4", {
      skip: !localMediaToolsAvailable,
    }, async () => {
      const dir = await mkdtemp(join(tmpdir(), "render-pipe-input-"));
      const sourcePath = join(dir, "source.mp4");
      const outputPath = join(dir, "two-clips.mp4");
      try {
        execFileSync(resolveFFmpegPath(), [
          "-y", "-f", "lavfi", "-i", "color=c=0x315e4b:s=96x64:r=12:d=1",
          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", sourcePath,
        ], { stdio: "ignore" });
        const result = await renderVideoAssembly([
          { sequenceNumber: 1, mediaUrl: sourcePath, inputFormat: "mp4", durationSeconds: 1, sourceKind: "scene" },
          { sequenceNumber: 2, mediaUrl: sourcePath, inputFormat: "mp4", durationSeconds: 1, sourceKind: "scene" },
        ], outputPath, {
          config: { width: 96, height: 64, fps: 12 },
        });

        assert.equal(result.success, true, result.error);
        assert.equal(result.clipCount, 2);
        assert.ok((result.durationSeconds ?? 0) > 1.5);
        assert.ok((result.fileSizeBytes ?? 0) > 0);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });
});
