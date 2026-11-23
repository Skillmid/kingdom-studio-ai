"use client";

import {
  calculateStoryBibleProgress,
  type StoryBibleProgressFieldValues,
  type StoryBibleSectionStatus,
} from "../utils/story-bible-progress";

interface StoryBibleProgressProps {
  values: StoryBibleProgressFieldValues;
}

function statusClassName(status: StoryBibleSectionStatus) {
  if (status === "Complete") {
    return "font-semibold text-green-400";
  }

  if (status === "Partially Complete") {
    return "font-semibold text-yellow-400";
  }

  return "text-zinc-500";
}

export default function StoryBibleProgress({
  values,
}: StoryBibleProgressProps) {
  const progress = calculateStoryBibleProgress(values);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
            Story Bible Progress
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {progress.percentage}% Complete
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            {progress.filled} of {progress.total} fields filled
          </p>
        </div>

        <div className="text-right">
          <p className="text-5xl font-bold text-yellow-500">
            {progress.percentage}%
          </p>
        </div>
      </div>

      <div className="mt-8 h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-yellow-500 transition-all duration-500"
          style={{
            width: `${progress.percentage}%`,
          }}
        />
      </div>

      <div className="mt-8 space-y-3">
        {progress.sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 px-5 py-3"
          >
            <span>
              {section.label}
              <span className="ml-3 text-xs text-zinc-500">
                {section.filled}/{section.total}
              </span>
            </span>

            <span className={statusClassName(section.status)}>
              {section.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
