import type { StoryboardPanel, StoryboardPanelProposal } from "../types/storyboard-panel";
import { withCalculatedProgress } from "./storyboard-completion";

export interface StoryboardShotInput {
  id: string;
  productionId: string;
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
  dialogueReference?: string;
  visualDescription?: string;
  continuityNotes?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  characterIds?: string[];
  locationId?: string;
}

export interface StoryboardSceneInput {
  id: string;
  heading?: string;
  timeOfDay?: string;
  action?: string;
  visualDirection?: string;
  cameraDirection?: string;
  mood?: string;
  musicNotes?: string;
  videoPrompt?: string;
  continuityNotes?: string;
  characterIds?: string[];
  locationId?: string;
}

export interface StoryboardCharacterInput {
  id: string;
  name: string;
  appearance?: string;
  distinguishingFeatures?: string;
  hairColor?: string;
  eyeColor?: string;
}

export interface StoryboardLocationInput {
  id: string;
  name: string;
  description?: string;
  setting?: string;
  timePeriod?: string;
  weather?: string;
  architecture?: string;
  lighting?: string;
  mood?: string;
}

export interface StoryboardPlanContext {
  scenes?: StoryboardSceneInput[];
  characters?: StoryboardCharacterInput[];
  locations?: StoryboardLocationInput[];
}

function clean(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function joinUnique(parts: Array<string | undefined>): string | undefined {
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
  return values.length > 0 ? values.join(" ") : undefined;
}

export function compositionFromShot(shot: StoryboardShotInput, scene?: StoryboardSceneInput): string {
  const parts = [
    shot.framing,
    shot.shotType.replace(/-/g, " "),
    shot.cameraAngle,
    shot.cameraMovement && shot.cameraMovement !== "static" ? shot.cameraMovement : undefined,
    shot.lens,
    scene?.cameraDirection && !shot.cameraAngle && !shot.cameraMovement ? scene.cameraDirection : undefined,
  ].filter(Boolean);
  return parts.join(" · ");
}

function characterContinuity(character: StoryboardCharacterInput): string | undefined {
  return joinUnique([
    character.name,
    character.appearance,
    character.distinguishingFeatures,
    character.hairColor ? `hair ${character.hairColor}` : undefined,
    character.eyeColor ? `eyes ${character.eyeColor}` : undefined,
  ]);
}

function buildGenerationPrompt(params: {
  shot: StoryboardShotInput;
  scene?: StoryboardSceneInput;
  location?: StoryboardLocationInput;
  characters: StoryboardCharacterInput[];
  visualDescription?: string;
  composition: string;
}): string | undefined {
  const { shot, scene, location, characters, visualDescription, composition } = params;
  if (shot.generationPrompt) {
    const extras = joinUnique([
      location?.name,
      location?.description,
      location?.lighting ? `lighting ${location.lighting}` : undefined,
      location?.weather ? `weather ${location.weather}` : undefined,
      ...characters.map((character) => characterContinuity(character)),
    ]);
    return extras && !shot.generationPrompt.toLowerCase().includes(extras.toLowerCase())
      ? `${shot.generationPrompt} Continuity: ${extras}`
      : shot.generationPrompt;
  }

  return joinUnique([
    composition,
    visualDescription,
    scene?.videoPrompt ? `Video: ${scene.videoPrompt}` : undefined,
    shot.subject,
    shot.dialogueReference ? `Dialogue: ${shot.dialogueReference}` : undefined,
    scene?.heading,
    scene?.mood ? `Mood: ${scene.mood}` : undefined,
    location?.name,
    location?.description,
    location?.lighting ? `Lighting: ${location.lighting}` : undefined,
    location?.weather ? `Weather: ${location.weather}` : undefined,
    ...characters.map((character) => characterContinuity(character)),
  ]);
}

export function planPanelsFromShots(
  shots: StoryboardShotInput[],
  context: StoryboardPlanContext = {},
): StoryboardPanelProposal[] {
  const scenes = new Map((context.scenes ?? []).map((scene) => [scene.id, scene]));
  const characters = new Map((context.characters ?? []).map((character) => [character.id, character]));
  const locations = new Map((context.locations ?? []).map((location) => [location.id, location]));

  return [...shots]
    .sort((a, b) => a.shotNumber - b.shotNumber)
    .map((shot, index) => {
      const scene = shot.sceneId ? scenes.get(shot.sceneId) : undefined;
      const characterIds =
        shot.characterIds && shot.characterIds.length > 0
          ? shot.characterIds
          : scene?.characterIds ?? [];
      const locationId = shot.locationId || scene?.locationId;
      const location = locationId ? locations.get(locationId) : undefined;
      const frameCharacters = characterIds
        .map((id) => characters.get(id))
        .filter((character): character is StoryboardCharacterInput => Boolean(character));

      const visualDescription = joinUnique([
        shot.visualDescription,
        shot.action,
        shot.subject,
        scene?.visualDirection,
        scene?.mood ? `Atmosphere: ${scene.mood}` : undefined,
      ]);
      const composition = compositionFromShot(shot, scene);
      const continuityNotes = joinUnique([
        shot.continuityNotes,
        scene?.continuityNotes,
        scene?.heading,
        scene?.timeOfDay,
        scene?.cameraDirection ? `Camera direction: ${scene.cameraDirection}` : undefined,
        scene?.mood ? `Scene mood: ${scene.mood}` : undefined,
        location?.name,
        location?.setting,
        location?.timePeriod ? `Period: ${location.timePeriod}` : undefined,
        location?.weather ? `Weather: ${location.weather}` : undefined,
        location?.architecture ? `Architecture: ${location.architecture}` : undefined,
        location?.lighting ? `Lighting: ${location.lighting}` : undefined,
        location?.mood ? `Location mood: ${location.mood}` : undefined,
        location?.description,
        ...frameCharacters.map((character) => characterContinuity(character)),
      ]);
      const sourceEvidence = joinUnique([
        shot.sourceEvidence,
        shot.visualDescription,
        shot.action,
        shot.dialogueReference,
        scene?.action,
        scene?.visualDirection,
        scene?.cameraDirection,
        scene?.mood,
        scene?.videoPrompt,
      ]);

      return withCalculatedProgress({
        productionId: shot.productionId,
        sceneId: shot.sceneId || scene?.id,
        shotId: shot.id,
        panelNumber: index + 1,
        title: shot.shotCode || shot.subject || `Shot ${shot.shotNumber}`,
        visualDescription,
        composition,
        continuityNotes,
        generationPrompt: buildGenerationPrompt({
          shot,
          scene,
          location,
          characters: frameCharacters,
          visualDescription,
          composition,
        }),
        sourceEvidence,
        characterIds,
        locationId,
        provenance: "shot-derived",
        userApproved: false,
        status: "draft",
        progress: 0,
      });
    });
}

export function selectNewPanelProposals(
  proposals: StoryboardPanelProposal[],
  existing: Array<Pick<StoryboardPanel, "shotId" | "panelNumber" | "title" | "userApproved" | "provenance">>,
): StoryboardPanelProposal[] {
  const existingShotIds = new Set(existing.map((panel) => panel.shotId).filter(Boolean) as string[]);
  const protectedTitles = new Set(
    existing
      .filter((panel) => panel.userApproved || panel.provenance === "user")
      .map((panel) => clean(panel.title).toLowerCase())
      .filter(Boolean),
  );

  return proposals.filter((proposal) => {
    if (proposal.shotId && existingShotIds.has(proposal.shotId)) return false;
    const title = clean(proposal.title).toLowerCase();
    if (title && protectedTitles.has(title)) return false;
    return true;
  });
}
