"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import type { Character } from "@/features/characters/types/character";
import type { Location } from "@/features/locations/types/location";
import type { Scene } from "@/features/scenes/types/scene";

import { withCalculatedProgress } from "../services/shot-completion";
import type { Shot, ShotFraming, ShotStatus, ShotType } from "../types/shot";
import { shotSchema } from "../validation/shot.schema";

interface ShotFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  productionId: string;
  nextNumber: number;
  shot?: Shot | null;
  scenes: Scene[];
  locations: Location[];
  characters: Character[];
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<Shot>) => Promise<void>;
}

const SHOT_TYPES: ShotType[] = [
  "establishing", "wide", "full", "medium", "close-up", "extreme-close-up",
  "over-shoulder", "pov", "insert", "two-shot", "group", "cutaway", "aerial", "tracking",
];
const FRAMINGS: ShotFraming[] = ["EWS", "WS", "FS", "MS", "MCU", "CU", "ECU", "OTS", "POV"];
const STATUSES: ShotStatus[] = ["draft", "in-progress", "completed"];
const inputClass = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-500/70";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-200">{label}</label>
      {children}
    </div>
  );
}

export default function ShotFormDialog(props: ShotFormDialogProps) {
  if (!props.open) return null;
  const formKey = props.mode === "edit" && props.shot ? `edit-${props.shot.id}` : `create-${props.nextNumber}`;
  return <ShotFormDialogFields key={formKey} {...props} />;
}

function ShotFormDialogFields({
  mode, productionId, nextNumber, shot, scenes, locations, characters, saving = false, onClose, onSubmit,
}: ShotFormDialogProps) {
  const editing = mode === "edit" && shot;
  const [shotNumber, setShotNumber] = useState(String(editing ? shot.shotNumber : nextNumber));
  const [shotCode, setShotCode] = useState(editing ? shot.shotCode ?? "" : "");
  const [shotType, setShotType] = useState<ShotType>(editing ? shot.shotType : "medium");
  const [framing, setFraming] = useState<ShotFraming>(editing ? shot.framing : "MS");
  const [subject, setSubject] = useState(editing ? shot.subject ?? "" : "");
  const [action, setAction] = useState(editing ? shot.action ?? "" : "");
  const [dialogueReference, setDialogueReference] = useState(editing ? shot.dialogueReference ?? "" : "");
  const [visualDescription, setVisualDescription] = useState(editing ? shot.visualDescription ?? "" : "");
  const [generationPrompt, setGenerationPrompt] = useState(editing ? shot.generationPrompt ?? "" : "");
  const [sourceEvidence, setSourceEvidence] = useState(editing ? shot.sourceEvidence ?? "" : "");
  const [sceneId, setSceneId] = useState(editing ? shot.sceneId ?? "" : "");
  const [locationId, setLocationId] = useState(editing ? shot.locationId ?? "" : "");
  const [characterIds, setCharacterIds] = useState<string[]>(editing ? shot.characterIds ?? [] : []);
  const [status, setStatus] = useState<ShotStatus>(editing ? shot.status : "draft");
  const [userApproved, setUserApproved] = useState(editing ? shot.userApproved : true);
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = shotSchema.safeParse({
      productionId,
      sceneId: sceneId || undefined,
      locationId: locationId || undefined,
      shotNumber: Number(shotNumber),
      shotCode: shotCode.trim() || undefined,
      shotType,
      framing,
      subject: subject.trim() || undefined,
      action: action.trim() || undefined,
      dialogueReference: dialogueReference.trim() || undefined,
      visualDescription: visualDescription.trim() || undefined,
      generationPrompt: generationPrompt.trim() || undefined,
      sourceEvidence: sourceEvidence.trim() || undefined,
      characterIds,
      provenance: editing ? shot.provenance : "user",
      userApproved,
      status,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the shot fields and try again.");
      return;
    }
    await onSubmit(withCalculatedProgress(parsed.data));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="my-8 w-full max-w-3xl space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Shot List</p>
            <h2 className="mt-2 text-2xl font-black text-white">{mode === "edit" ? "Edit Shot" : "New Shot"}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500 hover:text-white">Close</button>
        </div>
        {formError && <p className="rounded-xl bg-red-950/40 p-3 text-sm text-red-400">{formError}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Shot number"><input className={inputClass} value={shotNumber} onChange={(event) => setShotNumber(event.target.value)} /></Field>
          <Field label="Shot code"><input className={inputClass} value={shotCode} onChange={(event) => setShotCode(event.target.value)} placeholder="1A" /></Field>
          <Field label="Shot type">
            <select className={inputClass} value={shotType} onChange={(event) => setShotType(event.target.value as ShotType)}>
              {SHOT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Framing">
            <select className={inputClass} value={framing} onChange={(event) => setFraming(event.target.value as ShotFraming)}>
              {FRAMINGS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Scene">
            <select className={inputClass} value={sceneId} onChange={(event) => setSceneId(event.target.value)}>
              <option value="">Unassigned</option>
              {scenes.map((scene) => <option key={scene.id} value={scene.id}>Scene {scene.number}: {scene.heading}</option>)}
            </select>
          </Field>
          <Field label="Location">
            <select className={inputClass} value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="">Not assigned</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as ShotStatus)}>
              {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <label className="mt-8 flex items-center gap-3 text-sm text-zinc-300">
            <input type="checkbox" checked={userApproved} onChange={(event) => setUserApproved(event.target.checked)} />
            Filmmaker approved
          </label>
        </div>
        <Field label="Subject"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
        <Field label="Action"><textarea className={`${inputClass} min-h-24`} value={action} onChange={(event) => setAction(event.target.value)} /></Field>
        <Field label="Dialogue reference"><textarea className={`${inputClass} min-h-24`} value={dialogueReference} onChange={(event) => setDialogueReference(event.target.value)} /></Field>
        <Field label="Visual description"><textarea className={`${inputClass} min-h-24`} value={visualDescription} onChange={(event) => setVisualDescription(event.target.value)} /></Field>
        <Field label="Generation prompt"><textarea className={`${inputClass} min-h-24`} value={generationPrompt} onChange={(event) => setGenerationPrompt(event.target.value)} /></Field>
        <Field label="Source evidence"><textarea className={`${inputClass} min-h-24`} value={sourceEvidence} onChange={(event) => setSourceEvidence(event.target.value)} /></Field>
        {characters.length > 0 && (
          <Field label="Characters in shot">
            <div className="flex flex-wrap gap-2">
              {characters.map((character) => {
                const active = characterIds.includes(character.id);
                return (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => setCharacterIds((current) => current.includes(character.id) ? current.filter((id) => id !== character.id) : [...current, character.id])}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-300" : "border-zinc-800 bg-zinc-950 text-zinc-500"}`}
                  >
                    {character.name}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-5 py-2 text-sm text-zinc-300">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-yellow-500 px-5 py-2 text-sm font-black text-black disabled:opacity-50">
            {saving ? "Saving..." : mode === "edit" ? "Save Shot" : "Create Shot"}
          </button>
        </div>
      </form>
    </div>
  );
}
