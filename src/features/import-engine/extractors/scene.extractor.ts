export interface ExtractedScene {
  number: number;
  heading: string;
  summary: string;
  locationName?: string;
}

const SCENE_HEADING_REGEX =
  /^(?:\d+[\s.)-]+)?(?:INT\.|EXT\.|INTERIOR|EXTERIOR|INT\/EXT|EXT\/INT|I\/E)\s*(?:-|–|—|:)?\s*(.+)$/i;

function extractLocationName(heading: string): string | undefined {
  const match = heading.match(SCENE_HEADING_REGEX);
  if (!match?.[1]) return undefined;

  return match[1]
    .replace(/\s+-\s+(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME)\s*$/i, "")
    .replace(/\s+(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
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
      const headingMatch = trimmed.match(SCENE_HEADING_REGEX);

      if (headingMatch) {
        flush();

        const explicitNumber = trimmed.match(/^(\d+)[\s.)-]+/);
        const number = explicitNumber ? Number(explicitNumber[1]) : nextNumber;

        current = {
          number,
          heading: trimmed,
          summary: "",
          locationName: extractLocationName(trimmed),
        };

        nextNumber = Math.max(nextNumber, number + 1);
        continue;
      }

      if (!current || !trimmed) continue;

      // Keep action/description lines as the initial scene summary while
      // ignoring screenplay character cues and parentheticals.
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
