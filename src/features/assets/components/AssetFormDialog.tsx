"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { assetSchema } from "../validation/asset.schema";
import type { Asset, AssetKind } from "../types/asset";

interface AssetFormDialogProps {
  asset: Asset | null;
  productionId: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (asset: Partial<Asset>) => Promise<void>;
}

const kinds: AssetKind[] = [
  "character-reference", "location-reference", "prop", "costume", "image",
  "video", "audio", "music", "document", "other",
];
const inputClass = "mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-500";
const labelClass = "block text-sm font-semibold text-zinc-300";

export default function AssetFormDialog({ asset, productionId, saving = false, onClose, onSave }: AssetFormDialogProps) {
  const [form, setForm] = useState<Partial<Asset>>(() => asset ? { ...asset } : { kind: "other", title: "", description: "", prompt: "", fileUrl: "" });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Asset>(key: K, value: Asset[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = assetSchema.safeParse({
      ...form,
      id: asset?.id,
      productionId,
      sourceKind: asset?.sourceKind ?? "user",
      provenance: asset?.provenance ?? "user",
      userApproved: true,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the asset details and try again.");
      return;
    }
    const { status, progress, ...draft } = parsed.data;
    void status;
    void progress;
    try {
      const values: Partial<Asset> = { ...asset, ...draft, userApproved: true };
      delete values.status;
      delete values.progress;
      await onSave(values);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this asset.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="asset-form-title" className="my-8 w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <header className="border-b border-zinc-800 px-6 py-5">
            <h2 id="asset-form-title" className="text-xl font-black text-white">{asset ? "Review or edit asset" : "Add asset"}</h2>
            <p className="mt-1 text-sm text-zinc-400">Saving accepts this asset for production use. Image and video generation needs a prompt and an approved asset; audio and document generation is not yet supported.</p>
          </header>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className={labelClass}>
              Asset type
              <select value={form.kind ?? "other"} onChange={(event) => update("kind", event.target.value as AssetKind)} className={inputClass}>
                {kinds.map((kind) => <option key={kind} value={kind}>{kind.replace(/-/g, " ")}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Title
              <input autoFocus value={form.title ?? ""} onChange={(event) => update("title", event.target.value)} className={inputClass} maxLength={255} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Description
              <textarea value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} className={inputClass} rows={3} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Generation prompt
              <textarea value={form.prompt ?? ""} onChange={(event) => update("prompt", event.target.value)} className={inputClass} rows={4} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Media URL (optional)
              <input type="url" value={form.fileUrl ?? ""} onChange={(event) => update("fileUrl", event.target.value)} className={inputClass} placeholder="https://�" />
            </label>
            {asset?.sourceEvidence ? <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs leading-5 text-zinc-400 md:col-span-2"><span className="font-bold text-zinc-300">Source evidence: </span>{asset.sourceEvidence}</p> : null}
            {asset?.uncertaintyNotes ? <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200 md:col-span-2">{asset.uncertaintyNotes}</p> : null}
            {error ? <p role="alert" className="text-sm text-red-300 md:col-span-2">{error}</p> : null}
          </div>
          <footer className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-5">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-300 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-yellow-500 px-5 py-2 text-sm font-bold text-black disabled:opacity-50">{saving ? "Saving..." : asset ? "Save and approve" : "Add asset"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
