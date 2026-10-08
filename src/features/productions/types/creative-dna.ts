export const VISUAL_FORMATS = [
  "Live Action / Photorealistic",
  "Cinematic Realism",
  "2D Animation",
  "3D Animation",
  "Anime",
  "Stylized Animation",
  "Illustration",
  "Documentary",
  "Hybrid",
] as const;

export type VisualFormat = (typeof VISUAL_FORMATS)[number];

export interface AspectRatioOption {
  value: string;
  label: string;
  description: string;
  ratioWidth: number;
  ratioHeight: number;
}

export const ASPECT_RATIOS: readonly AspectRatioOption[] = [
  {
    value: "16:9",
    label: "16:9",
    description: "Standard Widescreen (Cinema & Streaming)",
    ratioWidth: 16,
    ratioHeight: 9,
  },
  {
    value: "2.39:1",
    label: "2.39:1",
    description: "Anamorphic Scope (Theatrical Epic)",
    ratioWidth: 239,
    ratioHeight: 100,
  },
  {
    value: "4:3",
    label: "4:3",
    description: "Classic Academy (Vintage & Intimate)",
    ratioWidth: 4,
    ratioHeight: 3,
  },
  {
    value: "9:16",
    label: "9:16",
    description: "Vertical (Mobile & Social)",
    ratioWidth: 9,
    ratioHeight: 16,
  },
  {
    value: "1:1",
    label: "1:1",
    description: "Square (Artistic & Balanced)",
    ratioWidth: 1,
    ratioHeight: 1,
  },
] as const;

export interface ProductionCreativeDNA {
  artStyle: string | null;
  aspectRatio: string;
  isCustomStyle: boolean;
  directiveText: string;
}

