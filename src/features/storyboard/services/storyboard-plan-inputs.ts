import type { StoryboardPanel } from "../types/storyboard-panel";
import type {
  StoryboardCharacterInput,
  StoryboardLocationInput,
  StoryboardSceneInput,
  StoryboardShotInput,
} from "./storyboard-planner";

export interface StoryboardPlanDataSource {
  getShots(): Promise<StoryboardShotInput[]>;
  getExistingPanels(): Promise<StoryboardPanel[]>;
  getScenes(): Promise<StoryboardSceneInput[]>;
  getCharacters(): Promise<StoryboardCharacterInput[]>;
  getLocations(): Promise<StoryboardLocationInput[]>;
}

export async function loadStoryboardPlanInputs(
  source: StoryboardPlanDataSource,
) {
  const [shots, existingPanels, scenes, characters, locations] = await Promise.all([
    source.getShots(),
    source.getExistingPanels(),
    source.getScenes(),
    source.getCharacters(),
    source.getLocations(),
  ]);

  return { shots, existingPanels, scenes, characters, locations };
}
