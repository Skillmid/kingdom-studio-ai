"use client";

import { useEffect, useState } from "react";

import type { Character } from "@/features/characters/types/character";
import type { Location } from "@/features/locations/types/location";

import type { Scene, SceneStatus, SceneType } from "../types/scene";
import { sceneSchema } from "../validation/scene.schema";

interface SceneFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  productionId: string;
  nextNumber: number;
  scene?: Scene | null;
  locations: Location[];
  characters: Character[];
  locationsLoading?: boolean;
  charactersLoading?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: SceneFormValues) => Promise<void>;
}

type SceneFormValues = {
  productionId: string;
  number: number;
  heading: string;
  sceneType: SceneType;
  timeOfDay?: string;
  summary?: string;
  action?: string;
  dialogue?: string;
  characterIds: string[];
  locationId?: string;
  purpose?: string;
  emotionalBeat?: string;
  storyBeat?: string;
  visualDirection?: string;
  props: string[];
  wardrobe?: string;
  soundNotes?: string;
  continuityNotes?: string;
  vfxNotes?: string;
  productionNotes?: string;
  aiPrompt?: string;
  sourceText?: string;
  estimatedDurationSeconds?: number;
  status: SceneStatus;
  progress: number;
};

const STATUS_OPTIONS: Array<{ value: SceneStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const TYPE_OPTIONS: SceneType[] = ["INT", "EXT", "BOTH"];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-zinc-200">{label}</label>
        {hint && <span className="text-[11px] text-zinc-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-500/70 focus:ring-1 focus:ring-yellow-500/20";
const textareaClass = `${inputClass} min-h-28 resize-y leading-6`;

export default function SceneFormDialog({
  open,
  mode,
  productionId,
  nextNumber,
  scene,
  locations,
  characters,
  locationsLoading = false,
  charactersLoading = false,
  saving = false,
  onClose,
  onSubmit,
}: SceneFormDialogProps) {
  const [number, setNumber] = useState(String(nextNumber));
  const [heading, setHeading] = useState("");
  const [sceneType, setSceneType] = useState<SceneType>("INT");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [summary, setSummary] = useState("");
  const [action, setAction] = useState("");
  const [dialogue, setDialogue] = useState("");
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [locationId, setLocationId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [emotionalBeat, setEmotionalBeat] = useState("");
  const [storyBeat, setStoryBeat] = useState("");
  const [visualDirection, setVisualDirection] = useState("");
  const [props, setProps] = useState("");
  const [wardrobe, setWardrobe] = useState("");
  const [soundNotes, setSoundNotes] = useState("");
  const [continuityNotes, setContinuityNotes] = useState("");
  const [vfxNotes, setVfxNotes] = useState("");
  const [productionNotes, setProductionNotes] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<SceneStatus>("draft");
  const [progress, setProgress] = useState("10");
  const [activeTab, setActiveTab] = useState<"story" | "production" | "ai">("story");
  const [showSource, setShowSource] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && scene) {
      setNumber(String(scene.number));
      setHeading(scene.heading);
      setSceneType(scene.sceneType);
      setTimeOfDay(scene.timeOfDay ?? "");
      setSummary(scene.summary ?? "");
      setAction(scene.action ?? "");
      setDialogue(scene.dialogue ?? "");
      setCharacterIds(scene.characterIds ?? []);
      setLocationId(scene.locationId ?? "");
      setPurpose(scene.purpose ?? "");
      setEmotionalBeat(scene.emotionalBeat ?? "");
      setStoryBeat(scene.storyBeat ?? "");
      setVisualDirection(scene.visualDirection ?? "");
      setProps((scene.props ?? []).join(", "));
      setWardrobe(scene.wardrobe ?? "");
      setSoundNotes(scene.soundNotes ?? "");
      setContinuityNotes(scene.continuityNotes ?? "");
      setVfxNotes(scene.vfxNotes ?? "");
      setProductionNotes(scene.productionNotes ?? "");
      setAiPrompt(scene.aiPrompt ?? "");
      setSourceText(scene.sourceText ?? "");
      setDuration(scene.estimatedDurationSeconds ? String(scene.estimatedDurationSeconds) : "");
      setStatus(scene.status);
      setProgress(String(scene.progress));
    } else {
      setNumber(String(nextNumber));
      setHeading("");
      setSceneType("INT");
      setTimeOfDay("");
      setSummary("");
      setAction("");
      setDialogue("");
      setCharacterIds([]);
      setLocationId("");
      setPurpose("");
      setEmotionalBeat("");
      setStoryBeat("");
      setVisualDirection("");
      setProps("");
      setWardrobe("");
      setSoundNotes("");
      setContinuityNotes("");
      setVfxNotes("");
      setProductionNotes("");
      setAiPrompt("");
      setSourceText("");
      setDuration("");
      setStatus("draft");
      setProgress("10");
    }

    setActiveTab("story");
    setShowSource(false);
    setFieldError(null);
  }, [open, mode, scene, nextNumber]);

  if (!open) return null;

  function toggleCharacter(id: string) {
    setCharacterIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const payload = {
      productionId,
      number: Number(number),
      heading,
      sceneType,
      timeOfDay: timeOfDay.trim() || undefined,
      summary: summary.trim() || undefined,
      action: action.trim() || undefined,
      dialogue: dialogue.trim() || undefined,
      characterIds,
      locationId: locationId || undefined,
      purpose: purpose.trim() || undefined,
      emotionalBeat: emotionalBeat.trim() || undefined,
      storyBeat: storyBeat.trim() || undefined,
      visualDirection: visualDirection.trim() || undefined,
      props: props.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
      wardrobe: wardrobe.trim() || undefined,
      soundNotes: soundNotes.trim() || undefined,
      continuityNotes: continuityNotes.trim() || undefined,
      vfxNotes: vfxNotes.trim() || undefined,
      productionNotes: productionNotes.trim() || undefined,
      aiPrompt: aiPrompt.trim() || undefined,
      sourceText: sourceText.trim() || undefined,
      estimatedDurationSeconds: duration ? Number(duration) : undefined,
      status,
      progress: Number(progress),
    };

    const result = sceneSchema.safeParse(payload);
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Please check the scene details.");
      return;
    }

    await onSubmit(result.data as SceneFormValues);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <div className="mx-auto my-8 max-w-5xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        <div className="border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Scene Planner · {mode === "edit" ? "Edit" : "New"}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Scene {number || "—"}</h2>
              <p className="mt-1 text-sm text-zinc-500">Build the scene as a production-ready creative record.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white">Close</button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[100px_1fr_150px]">
            <Field label="No."><input type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} className={inputClass} /></Field>
            <Field label="Scene Heading"><input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="INT. DAVID'S BEDROOM — MORNING" className={inputClass} /></Field>
            <Field label="Time"><input value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} placeholder="MORNING" className={inputClass} /></Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((type) => (
              <button key={type} type="button" onClick={() => setSceneType(type)} className={`rounded-full border px-4 py-2 text-xs font-bold tracking-wide transition ${sceneType === type ? "border-yellow-500 bg-yellow-500 text-black" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`}>{type}</button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex border-b border-zinc-800 bg-zinc-900/40 px-6 md:px-8">
            {(["story", "production", "ai"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`border-b-2 px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] transition ${activeTab === tab ? "border-yellow-500 text-yellow-400" : "border-transparent text-zinc-500 hover:text-zinc-200"}`}>
                {tab === "story" ? "Story & Performance" : tab === "production" ? "Production" : "AI & Continuity"}
              </button>
            ))}
          </div>

          <div className="space-y-6 p-6 md:p-8">
            {activeTab === "story" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Field label="Scene Summary" hint="What happens?"><textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A concise scene overview..." className={textareaClass} /></Field>
                <Field label="Story Purpose" hint="Why is this scene here?"><textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What must the audience understand or feel after this scene?" className={textareaClass} /></Field>
                <Field label="Action / Blocking"><textarea value={action} onChange={(e) => setAction(e.target.value)} placeholder="Physical action, movement and important business..." className={textareaClass} /></Field>
                <Field label="Dialogue"><textarea value={dialogue} onChange={(e) => setDialogue(e.target.value)} placeholder="Scene dialogue..." className={textareaClass} /></Field>
                <Field label="Emotional Beat"><textarea value={emotionalBeat} onChange={(e) => setEmotionalBeat(e.target.value)} placeholder="How does the emotional state change?" className={textareaClass} /></Field>
                <Field label="Story Beat"><textarea value={storyBeat} onChange={(e) => setStoryBeat(e.target.value)} placeholder="Setup, conflict, turn, revelation, consequence..." className={textareaClass} /></Field>
                <Field label="Characters in Scene">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    {charactersLoading ? <p className="p-2 text-sm text-zinc-500">Loading characters...</p> : characters.length === 0 ? <p className="p-2 text-sm text-zinc-500">No characters available yet.</p> : <div className="flex flex-wrap gap-2">{characters.map((character) => <button key={character.id} type="button" onClick={() => toggleCharacter(character.id)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${characterIds.includes(character.id) ? "border-yellow-500 bg-yellow-500/15 text-yellow-300" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`}>{character.name}</button>)}</div>}
                  </div>
                </Field>
                <Field label="Visual Direction"><textarea value={visualDirection} onChange={(e) => setVisualDirection(e.target.value)} placeholder="Composition, lighting, camera intention, visual storytelling..." className={textareaClass} /></Field>
              </div>
            )}

            {activeTab === "production" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Field label="Location">
                  <select value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={locationsLoading} className={inputClass}><option value="">{locationsLoading ? "Loading locations..." : "Select location"}</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
                </Field>
                <Field label="Estimated Duration" hint="seconds"><input type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" className={inputClass} /></Field>
                <Field label="Props" hint="comma or line separated"><textarea value={props} onChange={(e) => setProps(e.target.value)} placeholder="Bible, phone, contract..." className={textareaClass} /></Field>
                <Field label="Wardrobe"><textarea value={wardrobe} onChange={(e) => setWardrobe(e.target.value)} placeholder="David: university casual, backpack..." className={textareaClass} /></Field>
                <Field label="Sound & Music"><textarea value={soundNotes} onChange={(e) => setSoundNotes(e.target.value)} placeholder="Room tone, phone vibration, score cue..." className={textareaClass} /></Field>
                <Field label="Continuity Notes"><textarea value={continuityNotes} onChange={(e) => setContinuityNotes(e.target.value)} placeholder="Carry-over details from previous/next scene..." className={textareaClass} /></Field>
                <Field label="VFX / Practical Effects"><textarea value={vfxNotes} onChange={(e) => setVfxNotes(e.target.value)} placeholder="Rain, vehicle impact, screen graphics..." className={textareaClass} /></Field>
                <Field label="Production Notes"><textarea value={productionNotes} onChange={(e) => setProductionNotes(e.target.value)} placeholder="Crew notes, access, safety, scheduling, special requirements..." className={textareaClass} /></Field>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-6">
                <Field label="AI Visual Prompt" hint="Reusable scene-level prompt"><textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Cinematic prompt for generating a consistent visual reference for this scene..." className="min-h-40 w-full rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500/60" /></Field>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Source Traceability</p>
                  <p className="mt-2 text-sm text-zinc-400">The original screenplay extraction is preserved so manual development never destroys the source material.</p>
                  <button type="button" onClick={() => setShowSource((value) => !value)} className="mt-4 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white">{showSource ? "Hide Source" : "View Source"}</button>
                  {showSource && <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} className="mt-4 min-h-56 w-full rounded-xl border border-zinc-800 bg-black/30 p-4 font-mono text-xs leading-6 text-zinc-400 outline-none focus:border-zinc-600" />}
                </div>
              </div>
            )}

            {fieldError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{fieldError}</div>}
          </div>

          <div className="flex flex-col gap-4 border-t border-zinc-800 bg-zinc-900/30 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <select value={status} onChange={(e) => setStatus(e.target.value as SceneStatus)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"><option value="draft">Draft</option>{STATUS_OPTIONS.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              <label className="flex items-center gap-2 text-xs text-zinc-500"><span>Progress</span><input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} className="accent-yellow-500" /><span className="w-8 text-right text-zinc-300">{progress}%</span></label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 hover:text-white">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving Scene..." : mode === "edit" ? "Save Scene" : "Create Scene"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
