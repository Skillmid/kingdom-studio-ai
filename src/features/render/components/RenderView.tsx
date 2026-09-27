"use client";

export function RenderView({
  productionId,
  mode = "render",
}: {
  productionId: string;
  mode?: "render" | "export";
}) {
  return (
    <div className="space-y-4 p-6 md:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">
        Post-Production · {mode === "export" ? "Export" : "Render"}
      </p>
      <h1 className="text-3xl font-black text-white">{mode === "export" ? "Export" : "Render"}</h1>
      <p className="max-w-3xl text-sm leading-6 text-zinc-400">
        Assemble a sequence for production {productionId} from persisted shots, panels and assets. Media URLs are copied
        only when they already exist. Export writes a delivery manifest and does not invent a package file.
      </p>
    </div>
  );
}
