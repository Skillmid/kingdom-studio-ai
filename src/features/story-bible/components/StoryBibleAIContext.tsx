"use client";

interface StoryBibleAIContextProps {
  aiContext: string;
  aiRules: string;
  forbiddenElements: string;
  preferredVocabulary: string;
  visualConsistency: string;

  onAIContextChange: (
    value: string
  ) => void;

  onAIRulesChange: (
    value: string
  ) => void;

  onForbiddenElementsChange: (
    value: string
  ) => void;

  onPreferredVocabularyChange: (
    value: string
  ) => void;

  onVisualConsistencyChange: (
    value: string
  ) => void;
}

export default function StoryBibleAIContext({
  aiContext,
  aiRules,
  forbiddenElements,
  preferredVocabulary,
  visualConsistency,
  onAIContextChange,
  onAIRulesChange,
  onForbiddenElementsChange,
  onPreferredVocabularyChange,
  onVisualConsistencyChange,
}: StoryBibleAIContextProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div className="mb-8">

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Section 5
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          AI Context
        </h2>

        <p className="mt-3 max-w-3xl text-zinc-400">
          These instructions become the permanent creative memory
          for every AI tool inside Kingdom Studio AI. They help
          maintain consistency across scripts, characters,
          storyboards, scenes and visual generation.
        </p>

      </div>

      <div className="space-y-8">

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Global AI Context
          </label>

          <textarea
            rows={6}
            value={aiContext}
            onChange={(e) =>
              onAIContextChange(
                e.target.value
              )
            }
            placeholder="Describe everything the AI should always know about this production..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            AI Writing Rules
          </label>

          <textarea
            rows={6}
            value={aiRules}
            onChange={(e) =>
              onAIRulesChange(
                e.target.value
              )
            }
            placeholder="Example: Keep dialogue biblical, avoid modern slang, preserve character personalities..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Forbidden Elements
          </label>

          <textarea
            rows={5}
            value={forbiddenElements}
            onChange={(e) =>
              onForbiddenElementsChange(
                e.target.value
              )
            }
            placeholder="Describe themes, visuals or language the AI must never include."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Preferred Vocabulary
          </label>

          <textarea
            rows={5}
            value={preferredVocabulary}
            onChange={(e) =>
              onPreferredVocabularyChange(
                e.target.value
              )
            }
            placeholder="Words, phrases and expressions the AI should prefer when writing."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Visual Consistency Rules
          </label>

          <textarea
            rows={6}
            value={visualConsistency}
            onChange={(e) =>
              onVisualConsistencyChange(
                e.target.value
              )
            }
            placeholder="Describe how characters, costumes, architecture, lighting and environments should remain consistent throughout the production."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-5 outline-none transition focus:border-yellow-500"
          />

        </div>

      </div>

    </section>
  );
}