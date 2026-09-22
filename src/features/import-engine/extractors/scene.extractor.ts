import { parseSceneHeading } from "../scene-heading";

export interface ExtractedScene {
  number: number;
  heading: string;
  summary: string;
  locationName?: string;
}

export class SceneExtractor {
  async extract(screenplay: string): Promise<ExtractedScene[]> {
    if (!screenplay?.trim()) return [];

    const lines = screenplay.split(/\r?\n/);
    const scenes: ExtractedScene[] = [];
    let current: ExtractedScene | null = null;
    let nextNumber = 1;

    const flush = () => {
      if (!current) return;

      const cleanedSummary = current.summary
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);

      scenes.push({
        ...current,
        summary: cleanedSummary,
      });
    };

    for (const line of lines) {
      const trimmed = line.trim();
      const heading = parseSceneHeading(trimmed);

      if (heading) {
        flush();

        const explicitNumber = trimmed.match(/^(?:SCENE\s*#?\s*)?(\d+)[\s.)-]+/i);
        const number = explicitNumber ? Number(explicitNumber[1]) : nextNumber;

        current = {
          number,
          heading: heading.heading,
          summary: "",
          locationName: heading.locationName,
        };

        nextNumber = Math.max(nextNumber, number + 1);
        continue;
      }

      if (!current || !trimmed) continue;

      if (/^\(?[A-Z][A-Z0-9 .'-]{1,35}\)?$/.test(trimmed)) continue;
      if (/^\(.*\)$/.test(trimmed)) continue;
      if (/^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT TO)\b/i.test(trimmed)) continue;

      if (current.summary.length < 500) {
        current.summary = `${current.summary} ${trimmed}`.trim();
      }
    }

    flush();
    return scenes;
  }
}

export const sceneExtractor = new SceneExtractor();
