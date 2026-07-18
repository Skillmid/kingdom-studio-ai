"use client";

interface StoryBibleSaveStatusProps {
  saving: boolean;
  savedAt: Date | null;
}

export default function StoryBibleSaveStatus({
  saving,
  savedAt,
}: StoryBibleSaveStatusProps) {
  function getStatus() {
    if (saving) {
      return {
        icon: "●",
        text: "Saving Story Bible...",
        color: "text-yellow-400",
      };
    }

    if (!savedAt) {
      return {
        icon: "○",
        text: "Not yet saved",
        color: "text-zinc-500",
      };
    }

    return {
      icon: "✓",
      text: `Saved ${savedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      color: "text-green-400",
    };
  }

  const status = getStatus();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3">

      <span
        className={`text-lg font-bold ${status.color}`}
      >
        {status.icon}
      </span>

      <span
        className={`text-sm ${status.color}`}
      >
        {status.text}
      </span>

    </div>
  );
}