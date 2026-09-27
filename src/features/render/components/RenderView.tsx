"use client";

export function RenderView({ productionId, mode = "render" }: { productionId: string; mode?: "render" | "export" }) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-black text-white">{mode === "export" ? "Export" : "Render"}</h1>
      <p className="text-sm text-zinc-400">Sequence assembly copies media URLs only from existing assets or panels. Production {productionId}.</p>
    </div>
  );
}
