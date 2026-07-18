"use client";

interface StoryBibleFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  rows?: number;
  multiline?: boolean;
  onChange: (
    value: string
  ) => void;
}

export default function StoryBibleField({
  label,
  placeholder,
  value,
  rows = 4,
  multiline = false,
  onChange,
}: StoryBibleFieldProps) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      {multiline ? (

        <textarea
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 outline-none transition focus:border-yellow-500"
        />

      ) : (

        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-yellow-500"
        />

      )}

    </div>
  );
}