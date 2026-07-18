export type CharacterReferenceType =
  | "portrait"
  | "front"
  | "left-profile"
  | "right-profile"
  | "back"
  | "full-body"
  | "expression"
  | "costume"
  | "prop"
  | "pose"
  | "lighting"
  | "color-palette"
  | "custom";

export interface CharacterReferenceImage {
  id: string;

  characterId: string;

  type: CharacterReferenceType;

  title: string;

  imageUrl: string;

  thumbnailUrl?: string;

  notes?: string;

  tags: string[];

  order: number;

  createdAt: string;
}