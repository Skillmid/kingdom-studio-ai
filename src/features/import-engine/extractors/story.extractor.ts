export interface StoryExtraction {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  theme: string;
  acts: number;
  scenes: number;
}

const SCENE_HEADING_REGEX =
  /^(?:(?:\d+[\s.-]+)?(?:INT\.|EXT\.|EXTERIOR|INTERIOR|INT\/EXT|EXT\/INT)\b|\b(?:INT\.|EXT\.)\s)/im;

const ACT_HEADING_REGEX =
  /^(?:ACT\s+(?:[IVXLCDM]+|\d+|ONE|TWO|THREE|FOUR|FIVE))\b/im;

const TITLE_PREFIX_REGEX =
  /^(?:TITLE|SCRIPT TITLE|PROJECT TITLE):\s*(.+)$/i;

function extractTitle(lines: string[]): string {
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(TITLE_PREFIX_REGEX);
    if (match && match[1]) {
      return match[1].replace(/["']/g, "").trim();
    }
  }

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (
      line.length > 2 &&
      line.length < 60 &&
      line === line.toUpperCase() &&
      !SCENE_HEADING_REGEX.test(line) &&
      !ACT_HEADING_REGEX.test(line) &&
      !line.includes("BY") &&
      !line.includes("WRITTEN")
    ) {
      return line.replace(/["']/g, "").trim();
    }
  }

  return "Untitled Screenplay";
}

export class StoryExtractor {
  async extract(screenplay: string): Promise<StoryExtraction> {
    if (!screenplay || !screenplay.trim()) {
      return {
        title: "Untitled Screenplay",
        logline: "",
        synopsis: "",
        genre: "",
        theme: "",
        acts: 0,
        scenes: 0,
      };
    }

    const lines = screenplay.split(/\r?\n/);

    const title = extractTitle(lines);

    let sceneCount = 0;
    let explicitActCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (SCENE_HEADING_REGEX.test(trimmed)) {
        sceneCount++;
      } else if (ACT_HEADING_REGEX.test(trimmed)) {
        explicitActCount++;
      }
    }

    let calculatedActs = explicitActCount;
    if (calculatedActs === 0 && sceneCount > 0) {
      if (sceneCount <= 10) {
        calculatedActs = 1;
      } else if (sceneCount <= 25) {
        calculatedActs = 3;
      } else {
        calculatedActs = 3;
      }
    }

    return {
      title,
      logline: "",
      synopsis: "",
      genre: "Drama",
      theme: "",
      acts: calculatedActs,
      scenes: sceneCount,
    };
  }
}

export const storyExtractor = new StoryExtractor();