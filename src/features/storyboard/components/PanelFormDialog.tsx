"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import type { Character } from "@/features/characters/types/character";
import type { Location } from "@/features/locations/types/location";
import type { Scene } from "@/features/scenes/types/scene";
import type { Shot } from "@/features/shots/types/shot";

import { withCalculatedProgress } from "../services/storyboard-completion";
import type { StoryboardPanel, StoryboardStatus } from "../types/storyboard-panel";
import { storyboardPanelSchema } from "../validation/storyboard-panel.schema";

interface PanelFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  productionId: string;
  nextNumber: number;
  panel?: StoryboardPanel | null;
  scenes: Scene[];
  shots: Shot[];
  locations: Location[];
  characters: Character[];
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<StoryboardPanel>) => Promise<void>;
}

const STATUSES: StoryboardStatus[] = ["draft", "in-progress", "completed"];
const inputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-500/70";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-200">{label}</label>
      {children}
    </div>
  );
}

export default function PanelFormDialog(props: PanelFormDialogProps) {
  if (!props.open) return null;
  const formKey = props.mode === "edit" && props.panel ? `edit-${props.panel.id}` : `create-${props.nextNumber}`;
  return <PanelFormDialogFields key={formKey} {...props} />;
}

function PanelFormDialogFields({
  mode,
  productionId,
  nextNumber,
  panel,
  scenes,
  shots,
  locations,
  characters,
  saving = false,
  onClose,
  onSubmit,
}: PanelFormDialogProps) {
  const editing = mode === "edit" && panel;
  const [panelNumber, setPanelNumber] = useState(String(editing ? panel.panelNumber : nextNumber));
  const [title, setTitle] = useState(editing ? panel.title ?? "" : "");
  const [shotId, setShotId] = useState(editing ? panel.shotId ?? "" : "");
  const [sceneId, setSceneId] = useState(editing ? panel.sceneId ?? "" : "");
  const [locationId, setLocationId] = useState(editing ? panel.locationId ?? "" : "");
  const [visualDescription, setVisualDescription] = useState(editing ? panel.visualDescription ?? "" : "");
  const [composition, setComposition] = useState(editing ? panel.composition ?? "" : "");
  const [continuityNotes, setContinuityNotes] = useState(editing ? panel.continuityNotes ?? "" : "");
  const [generationPrompt, setGenerationPrompt] = useState(editing ? panel.generationPrompt ?? "" : "");
  const [sourceEvidence, setSourceEvidence] = useState(editing ? panel.sourceEvidence ?? "" : "");
  const [imageUrl, setImageUrl] = useState(editing ? panel.imageUrl ?? "" : "");
  const [characterIds, setCharacterIds] = useState<string[]>(editing ? panel.characterIds ?? [] : []);
  const [status, setStatus] = useState<StoryboardStatus>(editing ? panel.status : "draft");
  const [userApproved, setUserApproved] = useState(editing ? panel.userApproved : true);
  const [formError, setFormError] = useState("");

  function applyShot(id: string) {
    setShotId(id);
    const shot = shots.find((item) => item.id === id);
    if (!shot) return;
    if (!sceneId && shot.sceneId) setSceneId(shot.sceneId);
    if (!locationId && shot.locationId) setLocationId(shot.locationId);
    if (!title) setTitle(shot.shotCode || shot.subject || `Shot ${shot.shotNumber}`);
    if (!visualDescription) setVisualDescription(shot.visualDescription || shot.action || "");
    if (!composition) {
      setComposition(
        [shot.framing, shot.shotType.replace(/-/g, " "), shot.cameraAngle, shot.cameraMovement]
          .filter(Boolean)
          .join(" · "),
      );
    }
    if (!generationPrompt && shot.generationPrompt) setGenerationPrompt(shot.generationPrompt);
    if (!sourceEvidence) setSourceEvidence(shot.sourceEvidence || shot.visualDescription || shot.action || "");
    if (characterIds.length === 0 && shot.characterIds.length > 0) setCharacterIds(shot.characterIds);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = storyboardPanelSchema.safeParse({
      productionId,
      panelNumber: Number(panelNumber),
      title: title.trim() || undefined,
      shotId: shotId || undefined,
      sceneId: sceneId || undefined,
      locationId: locationId || undefined,
      visualDescription: visualDescription.trim() || undefined,
      composition: composition.trim() || undefined,
      continuityNotes: continuityNotes.trim() || undefined,
      generationPrompt: generationPrompt.trim() || undefined,
      sourceEvidence: sourceEvidence.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      characterIds,
      provenance: editing ? panel.provenance : "user",
      userApproved,
      status,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the panel fields and try again.");
      return;
    }
    await onSubmit(withCalculatedProgress(parsed.data));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="my-8 w-full max-w-3xl space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Storyboard</p>
            <h2 className="mt-2 text-2xl font-black text-white">{mode === "edit" ? "Edit Panel" : "New Panel"}</h2>
            <p className="mt-1 text-sm text-zinc-500">Keep visual continuity grounded in shot, scene, character and location records.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500 hover:text-white">
            Close
          </button>
        </div>
        {formError && <p className="rounded-xl bg-red-950/40 p-3 text-sm text-red-400">{formError}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Panel number">
            <input className={inputClass} value={panelNumber} onChange={(event) => setPanelNumber(event.target.value)} />
          </Field>
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Harbour gate dawn" />
          </Field>
          <Field label="Linked shot">
            <select className={inputClass} value={shotId} onChange={(event) => applyShot(event.target.value)}>
              <option value="">Unassigned</option>
              {shots.map((item) => (
                <option key={item.id} value={item.id}>
                  Shot {item.shotCode || item.shotNumber}: {item.subject || item.shotType}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Scene">
            <select className={inputClass} value={sceneId} onChange={(event) => setSceneId(event.target.value)}>
              <option value="">Unassigned</option>
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  Scene {scene.number}: {scene.heading}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <select className={inputClass} value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="">Not assigned</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as StoryboardStatus)}>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Visual description">
          <textarea className={`${inputClass} min-h-24`} value={visualDescription} onChange={(event) => setVisualDescription(event.target.value)} />
        </Field>
        <Field label="Composition">
          <input className={inputClass} value={composition} onChange={(event) => setComposition(event.target.value)} placeholder="EWS establishing · high" />
        </Field>
        <Field label="Continuity notes">
          <textarea className={`${inputClass} min-h-24`} value={continuityNotes} onChange={(event) => setContinuityNotes(event.target.value)} />
        </Field>
        <Field label="Generation prompt">
          <textarea className={`${inputClass} min-h-24`} value={generationPrompt} onChange={(event) => setGenerationPrompt(event.target.value)} />
        </Field>
        <Field label="Source evidence">
          <textarea className={`${inputClass} min-h-24`} value={sourceEvidence} onChange={(event) => setSourceEvidence(event.target.value)} />
        </Field>
        <Field label="Image URL">
          <input className={inputClass} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Optional until generation jobs exist" />
        </Field>
        {characters.length > 0 && (
          <Field label="Characters in frame">
            <div className="flex flex-wrap gap-2">
              {characters.map((character) => {
                const active = characterIds.includes(character.id);
                return (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() =>
                      setCharacterIds((current) =>
                        current.includes(character.id)
                          ? current.filter((id) => id !== character.id)
                          : [...current, character.id],
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-300"
                        : "border-zinc-800 bg-zinc-950 text-zinc-500"
                    }`}
                  >
                    {character.name}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <input type="checkbox" checked={userApproved} onChange={(event) => setUserApproved(event.target.checked)} />
          Filmmaker approved
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-5 py-2 text-sm text-zinc-300">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-yellow-500 px-5 py-2 text-sm font-black text-black disabled:opacity-50">
            {saving ? "Saving..." : mode === "edit" ? "Save Panel" : "Create Panel"}
          </button>
        </div>
      </form>
    </div>
  );
}
