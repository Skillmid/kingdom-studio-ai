import {
  ASPECT_RATIOS,
  type AspectRatioOption,
  type ProductionCreativeDNA,
  VISUAL_FORMATS,
  type VisualFormat,
} from "../types/creative-dna";
import type { Production } from "../types/production";

const DEFAULT_ASPECT_RATIO = "16:9";

export function isValidAspectRatio(ratio: string): boolean {
  const trimmed = ratio.trim();
  return (
    ASPECT_RATIOS.some((opt) => opt.value === trimmed) ||
    /^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(trimmed)
  );
}

export function normalizeAspectRatio(ratio?: string | null): string {
  if (!ratio || !ratio.trim()) {
    return DEFAULT_ASPECT_RATIO;
  }
  const trimmed = ratio.trim();
  const matched = ASPECT_RATIOS.find(
    (opt) => opt.value.toLowerCase() === trimmed.toLowerCase(),
  );
  if (matched) {
    return matched.value;
  }
  return isValidAspectRatio(trimmed) ? trimmed : DEFAULT_ASPECT_RATIO;
}

export function resolveAspectRatioOption(
  ratio?: string | null,
): AspectRatioOption {
  const normalized = normalizeAspectRatio(ratio);
  const matched = ASPECT_RATIOS.find((opt) => opt.value === normalized);
  if (matched) {
    return matched;
  }
  return {
    value: normalized,
    label: normalized,
    description: "Custom Framing",
    ratioWidth: 16,
    ratioHeight: 9,
  };
}

export function isStandardVisualFormat(
  style?: string | null,
): style is VisualFormat {
  if (!style) return false;
  return (VISUAL_FORMATS as readonly string[]).includes(style);
}

export function getProductionCreativeDNA(
  production: Pick<Production, "art_style" | "aspect_ratio">,
): ProductionCreativeDNA {
  const artStyle = production.art_style?.trim() || null;
  const aspectRatio = normalizeAspectRatio(production.aspect_ratio);
  const isCustomStyle = Boolean(artStyle && !isStandardVisualFormat(artStyle));

  const parts: string[] = [];
  if (artStyle) {
    parts.push(`Visual Style: ${artStyle}`);
  }
  parts.push(`Framing: ${aspectRatio}`);

  return {
    artStyle,
    aspectRatio,
    isCustomStyle,
    directiveText: parts.join(" • "),
  };
}

export function formatCreativePromptDirective(
  dna: Pick<ProductionCreativeDNA, "artStyle" | "aspectRatio">,
): string | undefined {
  const directives: string[] = [];
  if (dna.artStyle?.trim()) {
    directives.push(`Visual style: ${dna.artStyle.trim()}`);
  }
  if (dna.aspectRatio?.trim()) {
    directives.push(`Framing: ${dna.aspectRatio.trim()}`);
  }
  if (directives.length === 0) {
    return undefined;
  }
  return `[Creative Direction: ${directives.join(", ")}]`;
}

