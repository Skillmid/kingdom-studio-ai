"use client";

import type { DirectorNoteProposal } from "../types/director-note";
import { useDirectorNotes } from "../hooks/use-director-notes";

const editableFields = [
  ["title", "Scene title"],
  ["sceneIntent", "Scene intent"],
  ["blocking", "Blocking"],
  ["camera", "Camera"],
  ["composition", "Composition"],
  ["lighting", "Lighting"],
  ["pacing", "Pacing"],
  ["sound", "Sound"],
  ["emotion", "Emotion"],
  ["continuity", "Continuity"],
  ["uncertaintyNotes", "Unresolved information"],
] as const;

type EditableField = (typeof editableFields)[number][0];

export function DirectorNotesView({ productionId }: { productionId: string }) {
  const {
    notes, proposals, loading, planning, savingSceneId, approvingNoteId, error, notice,
    planNotes, editProposal, acceptProposal, rejectProposal, approveNote,
  } = useDirectorNotes(productionId);

  return (
    <main className="space-y-7 p-6 lg:p-8">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-500">Production pipeline</p>
        <h1 className="mt-2 text-3xl font-black text-white">AI Director</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Plan direction notes from this production&apos;s scenes and approved shot and storyboard records. Review, edit, and save each proposal yourself; sparse source information remains unresolved.
        </p>
      </header>

      {error ? <p role="alert" className="rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-200">{error}</p> : null}
      {notice ? <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-emerald-200">{notice}</p> : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Grounded direction proposals</h2>
            <p className="mt-1 text-sm text-zinc-400">Saved notes: {notes.length} | awaiting review: {proposals.length}</p>
          </div>
          <button type="button" disabled={planning || loading} onClick={planNotes} className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-black disabled:opacity-50">
            {planning ? "Planning..." : "Plan uncovered scenes"}
          </button>
        </div>
      </section>

      {proposals.map(({ proposal }) => (
        <ProposalCard
          key={proposal.sceneId || proposal.noteNumber}
          proposal={proposal}
          saving={savingSceneId === proposal.sceneId}
          onChange={(field, value) => proposal.sceneId && editProposal(proposal.sceneId, field, value)}
          onAccept={() => proposal.sceneId && acceptProposal(proposal.sceneId)}
          onReject={() => proposal.sceneId && rejectProposal(proposal.sceneId)}
        />
      ))}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">Saved direction notes</h2>
        {notes.map((note) => (
          <article key={note.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Note {note.noteNumber} | {note.provenance.replace(/-/g, " ")}</p>
                <h3 className="mt-1 text-lg font-bold text-white">{note.title || "Untitled scene"}</h3>
                <p className="mt-1 text-xs text-zinc-400">Completion {note.progress}% | {note.status.replace(/-/g, " ")} | {note.userApproved ? "creator approved" : "review required"}</p>
              </div>
              {!note.userApproved ? (
                <button type="button" disabled={approvingNoteId === note.id} onClick={() => approveNote(note)} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50">
                  {approvingNoteId === note.id ? "Saving..." : "Approve note"}
                </button>
              ) : null}
            </div>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              {editableFields.slice(1).map(([field, label]) => {
                const value = note[field as Exclude<EditableField, "title">];
                if (!value) return null;
                return <div key={field} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{value}</dd></div>;
              })}
            </dl>
            {note.sourceEvidence ? <p className="mt-4 border-l-2 border-yellow-500/50 pl-3 text-xs leading-5 text-zinc-400">Source evidence: {note.sourceEvidence}</p> : null}
          </article>
        ))}
        {!loading && notes.length === 0 && proposals.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-500">No direction notes are saved yet. Plan uncovered scenes to prepare grounded proposals.</p> : null}
        {loading ? <p className="text-sm text-zinc-500">Loading saved direction notes...</p> : null}
      </section>
    </main>
  );
}

function ProposalCard({
  proposal,
  saving,
  onChange,
  onAccept,
  onReject,
}: {
  proposal: DirectorNoteProposal;
  saving: boolean;
  onChange: (field: EditableField, value: string) => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-2xl border border-yellow-500/20 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-500">Proposal {proposal.noteNumber} | review before saving</p>
          <p className="mt-1 text-xs text-zinc-400">Derived from saved production records; it is not a persisted note.</p>
        </div>
        <p className="text-xs text-zinc-400">Completion {proposal.progress}%</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {editableFields.map(([field, label]) => (
          <label key={field} className="text-xs font-semibold text-zinc-400">
            {label}
            <textarea
              rows={field === "title" ? 1 : 3}
              value={proposal[field] ?? ""}
              onChange={(event) => onChange(field, event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-yellow-500"
            />
          </label>
        ))}
      </div>
      {proposal.sourceEvidence ? <p className="mt-4 border-l-2 border-yellow-500/50 pl-3 text-xs leading-5 text-zinc-400">Source evidence: {proposal.sourceEvidence}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={saving} onClick={onAccept} className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-black text-black disabled:opacity-50">{saving ? "Saving..." : "Accept and save note"}</button>
        <button type="button" disabled={saving} onClick={onReject} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-300 disabled:opacity-50">Reject proposal</button>
      </div>
    </article>
  );
}
