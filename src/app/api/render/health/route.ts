import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    workerMode: "durable-external",
    workerHealthUrl: process.env["RENDER_WORKER_HEALTH_URL"] ?? null,
  });
}
