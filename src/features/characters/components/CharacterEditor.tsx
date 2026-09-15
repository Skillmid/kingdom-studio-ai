"use client";

import { useEffect, useState } from "react";
import type { Character, CharacterRole, CharacterStatus } from "../types/character";

interface CharacterEditorProps {
  character: Character;
  saving?: boolean;
  onSave: (updates: Partial<Character>) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-500";

const labelClass = "mb-2 block text-sm font-medium text-zinc-300";

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={inputClass}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

export default function CharacterEditor({
  character,
  saving = false,
  onSave,
  onCancel,
}: CharacterEditorProps) {
  const [form, setForm] = useState<Partial<Character>>({ ...character });

  useEffect(() => {
    setForm({ ...character });
  }, [character]);

  function update<K extends keyof Character>(key: K, value: Character[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSave({
      name: form.name,
      role: form.role,
      status: form.status,
      age: form.age,
      gender: form.gender,
      occupation: form.occupation,
      nationality: form.nationality,
      ethnicity: form.ethnicity,
      biography: form.biography,
      appearance: form.appearance,
      height: form.height,
      weight: form.weight,
      eyeColor: form.eyeColor,
      hairColor: form.hairColor,
      distinguishingFeatures: form.distinguishingFeatures,
      personality: form.personality,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      fears: form.fears,
      habits: form.habits,
      values: form.values,
      motivation: form.motivation,
      goal: form.goal,
      conflict: form.conflict,
      characterArc: form.characterArc,
      spiritualJourney: form.spiritualJourney,
      speechStyle: form.speechStyle,
      catchPhrases: form.catchPhrases,
      aiInstructions: form.aiInstructions,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
              Character Profile
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {character.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-6">
          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Basic Information
            </h3>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Name"
                value={form.name ?? ""}
                onChange={(value) => update("name", value)}
                placeholder="Character name"
              />

              <div>
                <label className={labelClass}>Role</label>
                <select
                  value={form.role ?? "supporting"}
                  onChange={(event) =>
                    update("role", event.target.value as CharacterRole)
                  }
                  className={inputClass}
                >
                  <option value="lead">Lead</option>
                  <option value="supporting">Supporting</option>
                  <option value="minor">Minor</option>
                  <option value="extra">Extra</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={form.status ?? "draft"}
                  onChange={(event) =>
                    update("status", event.target.value as CharacterStatus)
                  }
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <Field
                label="Age"
                value={form.age ?? ""}
                onChange={(value) => update("age", value)}
                placeholder="e.g. 28"
              />

              <Field
                label="Gender"
                value={form.gender ?? ""}
                onChange={(value) => update("gender", value)}
                placeholder="e.g. Female"
              />

              <Field
                label="Occupation"
                value={form.occupation ?? ""}
                onChange={(value) => update("occupation", value)}
                placeholder="e.g. Teacher"
              />

              <Field
                label="Nationality"
                value={form.nationality ?? ""}
                onChange={(value) => update("nationality", value)}
                placeholder="e.g. Nigerian"
              />

              <Field
                label="Ethnicity"
                value={form.ethnicity ?? ""}
                onChange={(value) => update("ethnicity", value)}
                placeholder="Optional"
              />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Character Overview
            </h3>

            <div className="space-y-5">
              <Field
                label="Biography"
                value={form.biography ?? ""}
                onChange={(value) => update("biography", value)}
                placeholder="Who is this character?"
                multiline
              />

              <Field
                label="Appearance"
                value={form.appearance ?? ""}
                onChange={(value) => update("appearance", value)}
                placeholder="Describe the character's overall appearance."
                multiline
              />

              <Field
                label="Distinguishing Features"
                value={form.distinguishingFeatures ?? ""}
                onChange={(value) => update("distinguishingFeatures", value)}
                placeholder="Scars, mannerisms, notable physical features..."
                multiline
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Height"
                  value={form.height ?? ""}
                  onChange={(value) => update("height", value)}
                  placeholder="Optional"
                />

                <Field
                  label="Weight"
                  value={form.weight ?? ""}
                  onChange={(value) => update("weight", value)}
                  placeholder="Optional"
                />

                <Field
                  label="Eye Color"
                  value={form.eyeColor ?? ""}
                  onChange={(value) => update("eyeColor", value)}
                  placeholder="Optional"
                />

                <Field
                  label="Hair Color"
                  value={form.hairColor ?? ""}
                  onChange={(value) => update("hairColor", value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Personality
            </h3>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Personality"
                value={form.personality ?? ""}
                onChange={(value) => update("personality", value)}
                placeholder="Core personality traits..."
                multiline
              />

              <Field
                label="Strengths"
                value={form.strengths ?? ""}
                onChange={(value) => update("strengths", value)}
                placeholder="What makes this character strong?"
                multiline
              />

              <Field
                label="Weaknesses"
                value={form.weaknesses ?? ""}
                onChange={(value) => update("weaknesses", value)}
                placeholder="What are their weaknesses?"
                multiline
              />

              <Field
                label="Fears"
                value={form.fears ?? ""}
                onChange={(value) => update("fears", value)}
                placeholder="What does this character fear?"
                multiline
              />

              <Field
                label="Habits"
                value={form.habits ?? ""}
                onChange={(value) => update("habits", value)}
                placeholder="Recurring habits or behaviours..."
                multiline
              />

              <Field
                label="Values"
                value={form.values ?? ""}
                onChange={(value) => update("values", value)}
                placeholder="What does this character value?"
                multiline
              />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Story Arc
            </h3>

            <div className="space-y-5">
              <Field
                label="Motivation"
                value={form.motivation ?? ""}
                onChange={(value) => update("motivation", value)}
                placeholder="What drives this character?"
                multiline
              />

              <Field
                label="Goal"
                value={form.goal ?? ""}
                onChange={(value) => update("goal", value)}
                placeholder="What does the character want?"
                multiline
              />

              <Field
                label="Conflict"
                value={form.conflict ?? ""}
                onChange={(value) => update("conflict", value)}
                placeholder="What stands in the character's way?"
                multiline
              />

              <Field
                label="Character Arc"
                value={form.characterArc ?? ""}
                onChange={(value) => update("characterArc", value)}
                placeholder="How does the character change through the story?"
                multiline
              />

              <Field
                label="Spiritual Journey"
                value={form.spiritualJourney ?? ""}
                onChange={(value) => update("spiritualJourney", value)}
                placeholder="Spiritual growth, struggle, conviction, transformation..."
                multiline
              />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">
              Dialogue & AI Direction
            </h3>

            <div className="space-y-5">
              <Field
                label="Speech Style"
                value={form.speechStyle ?? ""}
                onChange={(value) => update("speechStyle", value)}
                placeholder="How does this character speak?"
                multiline
              />

              <Field
                label="Catchphrases"
                value={form.catchPhrases ?? ""}
                onChange={(value) => update("catchPhrases", value)}
                placeholder="Recurring expressions or phrases..."
                multiline
              />

              <Field
                label="AI Instructions"
                value={form.aiInstructions ?? ""}
                onChange={(value) => update("aiInstructions", value)}
                placeholder="Instructions for future AI character generation and direction..."
                multiline
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !form.name?.trim()}
              className="rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Character"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
