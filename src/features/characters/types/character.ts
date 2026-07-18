import type { CharacterReferenceImage } from "./character-reference";

export type CharacterRole =
  | "lead"
  | "supporting"
  | "minor"
  | "extra";

export type CharacterStatus =
  | "draft"
  | "in-progress"
  | "completed";

export interface Character {
  /**
   * Primary Identifier
   */
  id: string;

  productionId: string;

  /**
   * Basic Information
   */
  name: string;

  role: CharacterRole;

  status: CharacterStatus;

  age?: string;

  gender?: string;

  occupation?: string;

  nationality?: string;

  ethnicity?: string;

  biography?: string;

  /**
   * Physical Appearance
   */
  appearance?: string;

  height?: string;

  weight?: string;

  eyeColor?: string;

  hairColor?: string;

  distinguishingFeatures?: string;

  /**
   * Personality
   */
  personality?: string;

  strengths?: string;

  weaknesses?: string;

  fears?: string;

  habits?: string;

  values?: string;

  /**
   * Story Arc
   */
  motivation?: string;

  goal?: string;

  conflict?: string;

  characterArc?: string;

  spiritualJourney?: string;

  /**
   * Dialogue
   */
  speechStyle?: string;

  catchPhrases?: string;

  /**
   * AI Behaviour
   */
  aiInstructions?: string;

  /**
   * Progress Tracking
   */
  progress: number;

  /**
   * Visual References
   *
   * One Character
   *      ↓
   * Many Reference Images
   */
  references: CharacterReferenceImage[];

  /**
   * Metadata
   */
  createdAt: string;

  updatedAt: string;
}