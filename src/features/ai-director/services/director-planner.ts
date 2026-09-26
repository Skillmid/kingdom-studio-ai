import type { DirectorNote, DirectorNoteProposal } from "../types/director-note";
import { withCalculatedProgress } from "./director-completion";

export interface DirectorSceneInput {
  id: string;
  productionId?: string;
  number: number;
  heading: string;
  sceneType?: "INT" | "EXT" | "BOTH";
  timeOfDay?: string;
  summary?: string;
  action?: string;
  dialogue?: string;
  purpose?: string;
  emotionalBeat?: string;
  storyBeat?: string;
  visualDirection?: string;
  soundNotes?: string;
  continuityNotes?: string;
  estimatedDurationSeconds?: number;
  characterIds?: string[];
  locationId?: string;
}

export interface DirectorShotInput {
  id: string;
  sceneId?: string;
  shotNumber: number;
  shotCode?: string;
  shotType: string;
  framing: string;
  cameraAngle?: string;
  cameraMovement?: string;
  lens?: string;
  subject?: string;
  action?: string;
  estimatedDurationSeconds?: number;
  continuityNotes?: string;
}

export interface DirectorPanelInput {
  id: string;
  sceneId?: string;
  shotId?: string;
  composition?: string;
  visualDescription?: string;
  continuityNotes?: string;
}

export interface DirectorCharacterInput {
  id: string;
  name: string;
}

export interface DirectorLocationInput {
  id: string;
  name: string;
  description?: string;
  setting?: string;
}

export interface DirectorPlanContext {
  shots?: DirectorShotInput[];
  panels?: DirectorPanelInput[];
  characters?: DirectorCharacterInput[];
  locations?: DirectorLocationInput[];
}

function clean(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function joinUnique(parts: Array<string | undefined>, separator = " "): string | undefined {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const part of parts) {
    const value = clean(part);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(value);
  }
  return values.length > 0 ? values.join(separator) : undefined;
}

function clip(value: string | undefined, max = 280): string | undefined {
  const text = clean(value);
  if (!text) return undefined;
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function formatDuration(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function formatShotType(shot: DirectorShotInput): string {
  const movement =
    shot.cameraMovement && shot.cameraMovement !== "static" ? shot.cameraMovement : undefined;
  return joinUnique(
    [
      shot.shotCode || `Shot ${shot.shotNumber}`,
      shot.framing,
      shot.shotType.replace(/-/g, " "),
      shot.cameraAngle,
      movement,
      shot.lens,
      shot.subject,
    ],
    " · ",
  ) as string;
}

function missingFields(note: Pick<DirectorNoteProposal, "sceneIntent" | "blocking" | "camera" | "composition" | "lighting" | "pacing" | "sound" | "emotion" | "continuity">): string | undefined {
  const labels: Array<[keyof typeof note, string]> = [
    ["sceneIntent", "scene intent"],
    ["blocking", "blocking"],
    ["camera", "camera"],
    ["composition", "composition"],
    ["lighting", "lighting"],
    ["pacing", "pacing"],
    ["sound", "sound"],
    ["emotion", "emotion"],
    ["continuity", "continuity"],
  ];
  const missing = labels.filter(([field]) => !clean(note[field])).map(([, label]) => label);
  if (missing.length === 0) return undefined;
  return `Not established by current production records: ${missing.join(", ")}.`;
}

export function planDirectionFromScenes(
  scenes: DirectorSceneInput[],
  context: DirectorPlanContext = {},
): DirectorNoteProposal[] {
  const shotsByScene = new Map<string, DirectorShotInput[]>();
  for (const shot of context.shots ?? []) {
    if (!shot.sceneId) continue;
    const list = shotsByScene.get(shot.sceneId) ?? [];
    list.push(shot);
    shotsByScene.set(shot.sceneId, list);
  }
  const panelsByScene = new Map<string, DirectorPanelInput[]>();
  for (const panel of context.panels ?? []) {
    if (!panel.sceneId) continue;
    const list = panelsByScene.get(panel.sceneId) ?? [];
    list.push(panel);
    panelsByScene.set(panel.sceneId, list);
  }
  const characters = new Map((context.characters ?? []).map((character) => [character.id, character]));
  const locations = new Map((context.locations ?? []).map((location) => [location.id, location]));

  return [...scenes]
    .sort((a, b) => a.number - b.number)
    .map((scene, index) => {
      const sceneShots = (shotsByScene.get(scene.id) ?? []).sort((a, b) => a.shotNumber - b.shotNumber);
      const scenePanels = panelsByScene.get(scene.id) ?? [];
      const characterIds = scene.characterIds ?? [];
      const namedCharacters = characterIds
        .map((id) => characters.get(id)?.name)
        .filter((name): name is string => Boolean(name));
      const location = scene.locationId ? locations.get(scene.locationId) : undefined;

      const sceneIntent = joinUnique([scene.purpose, scene.storyBeat, scene.summary]);
      const blocking = joinUnique([
        clip(scene.action, 360),
        namedCharacters.length > 0 ? `Present: ${namedCharacters.join(", ")}.` : undefined,
      ]);
      const camera = sceneShots.length > 0
        ? sceneShots.map((shot) => formatShotType(shot)).join("; ")
        : undefined;
      const composition = joinUnique(
        scenePanels.map((panel) => joinUnique([panel.composition, clip(panel.visualDescription, 160)], " — ")),
        "; ",
      );
      const lighting = joinUnique([
        scene.timeOfDay ? `Time of day: ${scene.timeOfDay}` : undefined,
        scene.sceneType,
        clip(scene.visualDirection, 200),
        location?.setting,
      ]);
      const shotDuration = sceneShots.reduce(
        (sum, shot) => sum + (shot.estimatedDurationSeconds ?? 0),
        0,
      );
      const pacingDuration = formatDuration(scene.estimatedDurationSeconds || shotDuration || undefined);
      const pacing = joinUnique([
        pacingDuration ? `Estimated duration ${pacingDuration}` : undefined,
        sceneShots.length > 0 ? `${sceneShots.length} planned shot${sceneShots.length === 1 ? "" : "s"}` : undefined,
        scene.dialogue ? "Contains dialogue" : undefined,
      ], ". ");
      const sound = joinUnique([scene.soundNotes, scene.dialogue ? clip(scene.dialogue, 180) : undefined]);
      const emotion = clean(scene.emotionalBeat) || undefined;
      const continuity = joinUnique([
        scene.continuityNotes,
        location?.name,
        location?.description,
        ...sceneShots.map((shot) => shot.continuityNotes),
        ...scenePanels.map((panel) => panel.continuityNotes),
      ]);
      const sourceEvidence = joinUnique([
        scene.heading,
        clip(scene.action, 220),
        clip(scene.dialogue, 160),
        clip(scene.visualDirection, 160),
        sceneShots[0] ? formatShotType(sceneShots[0]) : undefined,
      ]);

      const draft = {
        productionId: scene.productionId ?? "",
        sceneId: scene.id,
        shotId: sceneShots[0]?.id,
        panelId: scenePanels[0]?.id,
        noteNumber: index + 1,
        title: scene.heading || `Scene ${scene.number}`,
        sceneIntent,
        blocking,
        camera,
        composition,
        lighting,
        pacing,
        sound,
        emotion,
        continuity,
        sourceEvidence,
        characterIds,
        locationId: scene.locationId,
        provenance: "production-derived" as const,
        userApproved: false,
        status: "draft" as const,
        progress: 0,
      };

      return withCalculatedProgress({
        ...draft,
        uncertaintyNotes: missingFields(draft),
      });
    });
}

export function selectNewDirectionNotes(
  proposals: DirectorNoteProposal[],
  existing: Array<Pick<DirectorNote, "sceneId" | "noteNumber" | "title" | "userApproved" | "provenance">>,
): DirectorNoteProposal[] {
  const existingSceneIds = new Set(existing.map((note) => note.sceneId).filter(Boolean) as string[]);
  const protectedTitles = new Set(
    existing
      .filter((note) => note.userApproved || note.provenance === "user")
      .map((note) => clean(note.title).toLowerCase())
      .filter(Boolean),
  );

  return proposals.filter((proposal) => {
    if (proposal.sceneId && existingSceneIds.has(proposal.sceneId)) return false;
    const title = clean(proposal.title).toLowerCase();
    if (title && protectedTitles.has(title)) return false;
    return true;
  });
}
