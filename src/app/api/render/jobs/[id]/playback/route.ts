import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { z } from "zod";

import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { LocalFileRenderStorageAdapter, verifyLocalPlaybackGrant } from "@/features/render/services/render-storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid render job ID format." }, { status: 400 });
    }

    const url = new URL(request.url);
    const storageKey = url.searchParams.get("key") ?? "";
    const expiresAt = url.searchParams.get("expires") ?? "";
    const signature = url.searchParams.get("sig") ?? "";
    if (!verifyLocalPlaybackGrant(id, storageKey, expiresAt, signature)) {
      return NextResponse.json({ error: "The render playback link is invalid or expired." }, { status: 403 });
    }
    const filePath = new LocalFileRenderStorageAdapter().getFilePath(storageKey);
    const metadata = await stat(filePath);
    const range = request.headers.get("range");
    let start = 0;
    let end = metadata.size - 1;
    let status = 200;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${metadata.size}`, "Cache-Control": "private, no-store" },
        });
      }
      if (match[1]) {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : end;
      } else {
        const suffixLength = Number(match[2]);
        start = Math.max(0, metadata.size - suffixLength);
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= metadata.size || end < start) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${metadata.size}`, "Cache-Control": "private, no-store" },
        });
      }
      end = Math.min(end, metadata.size - 1);
      status = 206;
    }

    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream<Uint8Array>;
    return new Response(stream, {
      status,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(end - start + 1),
        "Content-Disposition": `inline; filename="${id}.mp4"`,
        "Accept-Ranges": "bytes",
        ...(status === 206 ? { "Content-Range": `bytes ${start}-${end}/${metadata.size}` } : {}),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (caught) {
    if (caught instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: caught.message }, { status: 503 });
    }
    if (caught instanceof Error && "code" in caught && caught.code === "ENOENT") {
      return NextResponse.json({ error: "The rendered file is no longer available." }, { status: 404 });
    }
    console.error("Unable to stream render playback.", caught);
    return NextResponse.json({ error: "Unable to load render playback." }, { status: 500 });
  }
}
