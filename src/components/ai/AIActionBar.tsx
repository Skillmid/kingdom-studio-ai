"use client";

interface AIActionBarProps {
  generating?: boolean;

  onGenerate?: () => void;

  onImprove?: () => void;

  onExpand?: () => void;

  onRewrite?: () => void;

  onSummarize?: () => void;
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium transition hover:border-yellow-500 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      ✨ {label}
    </button>
  );
}

export default function AIActionBar({
  generating = false,

  onGenerate,

  onImprove,

  onExpand,

  onRewrite,

  onSummarize,
}: AIActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

      <ActionButton
        label={
          generating
            ? "Generating..."
            : "Generate"
        }
        disabled={generating}
        onClick={onGenerate}
      />

      <ActionButton
        label="Improve"
        disabled={generating}
        onClick={onImprove}
      />

      <ActionButton
        label="Expand"
        disabled={generating}
        onClick={onExpand}
      />

      <ActionButton
        label="Rewrite"
        disabled={generating}
        onClick={onRewrite}
      />

      <ActionButton
        label="Summarize"
        disabled={generating}
        onClick={onSummarize}
      />

    </div>
  );
}