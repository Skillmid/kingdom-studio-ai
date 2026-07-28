export interface StoryExtraction {
  title: string;

  logline: string;

  synopsis: string;

  genre: string;

  theme: string;

  acts: number;

  scenes: number;
}

export class StoryExtractor {
  async extract(
    screenplay: string
  ): Promise<StoryExtraction> {
    console.log(
      "Extracting story..."
    );

    return {
      title: "",

      logline: "",

      synopsis: "",

      genre: "",

      theme: "",

      acts: 0,

      scenes: 0,
    };
  }
}

export const storyExtractor =
  new StoryExtractor();