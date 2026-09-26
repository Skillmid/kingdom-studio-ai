import { withCalculatedProgress } from "./shot-completion";
import type { Shot, ShotFraming, ShotProposal, ShotType } from "../types/shot";

export interface ShotPlanScene {
  id: string;
  number: number;
  heading: string;
  sceneType?: "INT" | "EXT" | "BOTH";
  summary?: string;
  action?: string;
  dialogue?: string;
  visualDirection?: string;
  continuityNotes?: string;
  sourceText?: string;
  characterIds?: string[];
  locationId?: string;
}

export type SceneBeatKind = "action" | "dialogue";

export interface SceneBeat {
  kind: SceneBeatKind;
  text: string;
  speaker?: string;
  evidence: string;
}

const SCENE_HEADING_PATTERN =
  /^(?:\d+[A-Z]?\.\s*)?(?:INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT|EXT|I\/E|E\/I|EST)(?:[\.\s:/]|$)/i;
const TRANSITION_PATTERN =
  /^(?:CUT TO|FADE IN|FADE OUT|FADE TO|DISSOLVE TO|SMASH CUT|MATCH CUT|WIPE TO|JUMP CUT TO)[:.]?$/i;
const SPEAKER_PATTERN = /^([A-Z][A-Z0-9 .'\\-]{1,48})(?:\s*\([^)]*\))?$/;
const PARENTHETICAL_PATTERN = /^\([^)]+\)$/;

const FRAMING_BY_TYPE: Record<ShotType, ShotFraming> = {
  establishing: "EWS",
  wide: "WS",
  full: "FS",
  medium: "MS",
  "close-up": "CU",
  "extreme-close-up": "ECU",
  "over-shoulder": "OTS",
  pov: "POV",
  insert: "CU",
  "two-shot": "MS",
  group: "WS",
  cutaway: "MCU",
  aerial: "EWS",
  tracking: "WS",
};

export function extractBeats(sourceText: string): SceneBeat[] {
  const lines = sourceText.replace(/\r\n/g, "\n").split("\n");
  const beats: SceneBeat[] = [];
  let speaker: string | undefined;
  let dialogueBuffer: string[] = [];

  function flushDialogue() {
    const text = dialogueBuffer.join(" ").replace(/\s+/g, " ").trim();
    if (speaker && text) {
      beats.push({
        kind: "dialogue",
        text,
        speaker,
        evidence: `${speaker}\n${text}`,
      });
    }
    dialogueBuffer = [];
    speaker = undefined;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushDialogue();
      continue;
    }
    if (SCENE_HEADING_PATTERN.test(line) || TRANSITION_PATTERN.test(line)) {
      flushDialogue();
      continue;
    }
    if (PARENTHETICAL_PATTERN.test(line)) {
      continue;
    }
    if (isSpeakerCue(line)) {
      flushDialogue();
      speaker = line.replace(/\s*\([^)]*\)$/, "").trim();
      continue;
    }
    if (speaker) {
      if (dialogueBuffer.length === 0 || PARENTHETICAL_PATTERN.test(line) || line === line.toUpperCase()) {
        dialogueBuffer.push(line);
        continue;
      }
      flushDialogue();
    }
    beats.push({
      kind: "action",
      text: line,
      evidence: line,
    });
  }

  flushDialogue();
  return beats;
}

function isSpeakerCue(line: string): boolean {
  if (!SPEAKER_PATTERN.test(line)) return false;
  if (SCENE_HEADING_PATTERN.test(line) || TRANSITION_PATTERN.test(line)) return false;
  if (line.includes(".") && /\b(?:INT|EXT)\b/i.test(line)) return false;
  const letters = line.replace(/[^A-Za-z]/g, "");
  return letters.length >= 2 && letters === letters.toUpperCase();
}

export function inferActionShotType(action: string): ShotType {
  const text = action.toLowerCase();
  if (/\b(chase[sd]?|pursu\w*|sprints?|runs?(?:\s+after)?|follows?|tracking)\b/.test(text)) return "tracking";
  if (/\b(from above|aerial|drone|bird'?s[- ]eye|skyline)\b/.test(text)) return "aerial";
  if (/\b(picks? up|insert|close on|the phone|the letter|the screen|the note)\b/.test(text)) return "insert";
  if (/\b(crowd|gathered|group of|together around)\b/.test(text)) return "group";
  if (/\b(watches?|sees?|looks out|point of view|through (?:her|his|their) eyes)\b/.test(text)) return "pov";
  if (/\b(eyes?|tears?|face|stares?|whispers?)\b/.test(text)) return "close-up";
  if (/\b(establishes?|wide of|cityscape|street outside|opens on)\b/.test(text)) return "establishing";
  if (/\b(walks?|enters?|exits?|across the)\b/.test(text)) return "wide";
  return "medium";
}

export function framingForShotType(shotType: ShotType): ShotFraming {
  return FRAMING_BY_TYPE[shotType];
}

export function buildGenerationPrompt(proposal: Pick<
  ShotProposal,
  "shotType" | "framing" | "cameraAngle" | "cameraMovement" | "subject" | "action" | "visualDescription"
>): string {
  const parts = [
    `${proposal.framing} ${proposal.shotType.replace(/-/g, " ")} shot`,
    proposal.cameraAngle ? `${proposal.cameraAngle} angle` : undefined,
    proposal.cameraMovement && proposal.cameraMovement !== "static"
      ? `${proposal.cameraMovement} movement`
      : "static camera",
    proposal.subject ? `subject: ${proposal.subject}` : undefined,
    proposal.action ? `action: ${proposal.action}` : undefined,
    proposal.visualDescription,
  ].filter(Boolean);
  return parts.join(". ") + ".";
}

export interface PlanShotsOptions {
  productionId: string;
  scenes: ShotPlanScene[];
}

export function planShotsFromScenes({ productionId, scenes }: PlanShotsOptions): ShotProposal[] {
  const proposals: ShotProposal[] = [];
  let globalShotNumber = 1;

  for (const scene of [...scenes].sort((a, b) => a.number - b.number)) {
    const source = [scene.heading, scene.action, scene.dialogue, scene.sourceText]
      .filter(Boolean)
      .join("\n");
    const beats = extractBeats(source);
    const sceneShots: ShotProposal[] = [];
    let localIndex = 1;

    sceneShots.push(
      completeProposal({
        productionId,
        sceneId: scene.id,
        sceneNumber: scene.number,
        shotNumber: globalShotNumber,
        shotCode: `${scene.number}.${localIndex}`,
        shotType: scene.sceneType === "EXT" ? "establishing" : "wide",
        framing: scene.sceneType === "EXT" ? "EWS" : "WS",
        cameraAngle: scene.sceneType === "EXT" ? "high" : "eye-level",
        cameraMovement: "static",
        subject: scene.heading,
        action: scene.summary || scene.heading,
        visualDescription: scene.visualDirection || scene.heading,
        continuityNotes: scene.continuityNotes,
        sourceEvidence: scene.heading,
        characterIds: scene.characterIds ?? [],
        locationId: scene.locationId,
        estimatedDurationSeconds: 4,
        provenance: "scene-derived",
        userApproved: false,
        status: "draft",
        progress: 0,
      }),
    );
    globalShotNumber += 1;
    localIndex += 1;

    for (const beat of beats) {
      if (sceneShots.length >= 8) break;

      const shotType =
        beat.kind === "dialogue"
          ? inferDialogueShotType(beat, beats)
          : inferActionShotType(beat.text);
      const proposal = completeProposal({
        productionId,
        sceneId: scene.id,
        sceneNumber: scene.number,
        shotNumber: globalShotNumber,
        shotCode: `${scene.number}.${localIndex}`,
        shotType,
        framing: framingForShotType(shotType),
        cameraAngle: "eye-level",
        cameraMovement: shotType === "tracking" ? "track" : "static",
        subject: beat.kind === "dialogue" ? beat.speaker : firstClause(beat.text),
        action: beat.kind === "action" ? beat.text : undefined,
        dialogueReference: beat.kind === "dialogue" ? `${beat.speaker}: ${beat.text}` : undefined,
        visualDescription: beat.text,
        sourceEvidence: beat.evidence,
        characterIds: scene.characterIds ?? [],
        locationId: scene.locationId,
        estimatedDurationSeconds: beat.kind === "dialogue" ? 3 : 2,
        provenance: "scene-derived",
        userApproved: false,
        status: "draft",
        progress: 0,
      });

      sceneShots.push(proposal);
      globalShotNumber += 1;
      localIndex += 1;
    }

    proposals.push(...sceneShots);
  }

  return proposals;
}

function inferDialogueShotType(beat: SceneBeat, allBeats: SceneBeat[]): ShotType {
  const speakers = new Set(
    allBeats.filter((item) => item.kind === "dialogue" && item.speaker).map((item) => item.speaker),
  );
  if (speakers.size >= 3) return "group";
  if (speakers.size === 2) return "over-shoulder";
  if (/\b(whisper|breath|eyes|tear)\b/i.test(beat.text)) return "extreme-close-up";
  return "close-up";
}

function firstClause(text: string): string {
  return text.split(/[.,;]/)[0]?.trim().slice(0, 160) || text.slice(0, 160);
}

function completeProposal(proposal: ShotProposal): ShotProposal {
  const withPrompt: ShotProposal = {
    ...proposal,
    generationPrompt: proposal.generationPrompt ?? buildGenerationPrompt(proposal),
  };
  return withCalculatedProgress(withPrompt);
}

export function selectNewShotProposals(
  proposals: ShotProposal[],
  existing: Array<Pick<Shot, "sceneId" | "shotCode" | "subject" | "action" | "dialogueReference" | "userApproved" | "provenance">>,
): ShotProposal[] {
  const protectedKeys = new Set(
    existing
      .filter((shot) => shot.userApproved || shot.provenance === "user")
      .map((shot) => coverageKey(shot.sceneId, shot.subject, shot.action, shot.dialogueReference, shot.shotCode)),
  );
  const existingKeys = new Set(
    existing.map((shot) => coverageKey(shot.sceneId, shot.subject, shot.action, shot.dialogueReference, shot.shotCode)),
  );

  return proposals.filter((proposal) => {
    const key = coverageKey(
      proposal.sceneId,
      proposal.subject,
      proposal.action,
      proposal.dialogueReference,
      proposal.shotCode,
    );
    if (protectedKeys.has(key) || existingKeys.has(key)) return false;
    return true;
  });
}

function coverageKey(
  sceneId?: string,
  subject?: string,
  action?: string,
  dialogueReference?: string,
  shotCode?: string,
): string {
  const normalize = (value?: string) => (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return [sceneId ?? "", normalize(shotCode), normalize(subject), normalize(action), normalize(dialogueReference)].join(
    "|",
  );
}
