"use client";

import type { SceneStatus } from "@/features/scenes/types/scene";

import { useSceneExtraction } from "../hooks/use-scene-extraction";
import type { ProposedScene } from "../types/scene-proposal";

interface SceneExtractionPanelProps {
  productionId: string;
  screenplay: string;
}

const STATUS_OPTIONS: Array<{ value: SceneStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function SceneExtractionPanel({
  productionId,
  screenplay,
}: SceneExtractionPanelProps) {
  const {
    proposals,
    extracting,
    saving,
    error,
    notice,
    extractScenes,
    updateProposal,
    toggleProposal,
    approveScene,
    approveSelected,
    approveAll,
    clearProposals,
  } = useSceneExtraction(productionId);

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
            Scene Extraction
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Proposed Scenes
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Analyse the current screenplay and review proposed scenes before
            anything is written to the production. Approved scenes are saved
            through the existing Scene Planner records.
          </p>
        </div>

        <button
          type="button"
          disabled={extracting || saving || !screenplay.trim()}
          onClick={() => void extractScenes(screenplay)}
          className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {extracting ? "Extracting..." : "Extract Scenes"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          {notice}
        </div>
      )}

      {proposals.length === 0 && !extracting && (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-8 text-sm text-zinc-400">
          No proposed scenes yet. Extract from the current screenplay to
          generate a reviewable list. Nothing is persisted until you approve
          a scene.
        </div>
      )}

      {proposals.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void approveSelected()}
              className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Approve Selected"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void approveAll()}
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              Approve All
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={clearProposals}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500"
            >
              Discard Proposals
            </button>
          </div>

          <div className="space-y-4">
            {proposals.map((proposal) => (
              <ProposalRow
                key={proposal.clientId}
                proposal={proposal}
                disabled={saving}
                onToggle={() => toggleProposal(proposal.clientId)}
                onChange={(updates) =>
                  updateProposal(proposal.clientId, updates)
                }
                onApprove={() => void approveScene(proposal.clientId)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ProposalRow({
  proposal,
  disabled,
  onToggle,
  onChange,
  onApprove,
}: {
  proposal: ProposedScene;
  disabled: boolean;
  onToggle: () => void;
  onChange: (updates: Partial<ProposedScene>) => void;
  onApprove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={proposal.selected}
            disabled={disabled}
            onChange={onToggle}
            className="h-4 w-4 accent-yellow-500"
          />
          Selected for approval
        </label>

        <button
          type="button"
          disabled={disabled}
          onClick={onApprove}
          className="rounded-xl border border-yellow-500/40 px-3 py-2 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/10 disabled:opacity-50"
        >
          Approve This Scene
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_180px]">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
            Number
          </label>
          <input
            type="number"
            min={1}
            disabled={disabled}
            value={proposal.number}
            onChange={(event) =>
              onChange({ number: Number(event.target.value) || 1 })
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
            Heading
          </label>
          <input
            disabled={disabled}
            value={proposal.heading}
            onChange={(event) => onChange({ heading: event.target.value })}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
            Status
          </label>
          <select
            disabled={disabled}
            value={proposal.status}
            onChange={(event) =>
              onChange({ status: event.target.value as SceneStatus })
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
          Summary
        </label>
        <textarea
          disabled={disabled}
          rows={3}
          value={proposal.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
          Progress ({proposal.progress}%)
        </label>
        <input
          type="range"
          min={0}
          max={100}
          disabled={disabled}
          value={proposal.progress}
          onChange={(event) =>
            onChange({ progress: Number(event.target.value) })
          }
          className="w-full accent-yellow-500"
        />
      </div>
    </div>
  );
}
