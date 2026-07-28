export interface DialogueMetrics {
  totalDialogue: number;

  averageLength: number;

  uniqueSpeakers: number;
}

export class DialogueExtractor {
  async analyze(
    screenplay: string
  ): Promise<DialogueMetrics> {
    console.log(
      "Analyzing dialogue..."
    );

    return {
      totalDialogue: 0,

      averageLength: 0,

      uniqueSpeakers: 0,
    };
  }
}

export const dialogueExtractor =
  new DialogueExtractor();