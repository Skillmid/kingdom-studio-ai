import {
  extractFromScreenplay,
  type LocationExtraction,
} from "../extract-from-screenplay";

export type { LocationExtraction };

export class LocationExtractor {
  async extract(screenplay: string): Promise<LocationExtraction[]> {
    return extractFromScreenplay(screenplay).locations;
  }
}

export const locationExtractor = new LocationExtractor();
