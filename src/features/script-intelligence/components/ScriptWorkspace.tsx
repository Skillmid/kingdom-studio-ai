"use client";

import {
  useState,
} from "react";

import {
  SaveProvider,
  SaveStatus,
  useSave,
} from "@/platform/save";

import {
  useScriptWorkspace,
} from "../hooks/use-script-workspace";

import ScriptEditor from "./ScriptEditor";
import ScriptImport from "./ScriptImport";
import ScriptIntelligencePanel from "./ScriptIntelligencePanel";
import ScriptRevisionHistory from "./ScriptRevisionHistory";

interface ScriptWorkspaceProps {
  productionId: string;
}

function ScriptWorkspaceContent({
  productionId,
}: ScriptWorkspaceProps) {
  const {
    screenplay,

    content,
    setContent,

    title,
    setTitle,

    fileName,

    knowledge,

    analysis,

    revisions,

    loading,

    processing,

    saving,

    error,

    isDirty,

    importScript,

    saveScreenplay,

    clear,
  } = useScriptWorkspace(
    productionId
  );

  const {
    runSave,
  } = useSave();

  const [
    intelligenceOpen,
    setIntelligenceOpen,
  ] = useState(true);

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);

  async function handleSave() {
    try {
      await runSave(
        async () => {
          await saveScreenplay();
        }
      );
    } catch {
      // SaveProvider and workspace
      // already expose the error.
    }
  }

  if (loading) {
    return (
      <div className="p-10">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-20 text-center">
          Loading screenplay...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-8 p-8">

      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">

        <div className="min-w-0 flex-1">

          <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
            Kingdom Studio AI
          </p>

          <h1 className="mt-2 text-5xl font-bold">
            Screenplay
          </h1>

          <p className="mt-4 max-w-4xl text-zinc-400">
            Write, import, analyse,
            professionally refine, and
            prepare the screenplay for
            the production pipeline.
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-3">

          <SaveStatus />

          {isDirty && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
              Unsaved changes
            </div>
          )}

          <button
            type="button"
            disabled={
              saving ||
              processing ||
              !content.trim() ||
              !isDirty
            }
            onClick={
              handleSave
            }
            className="rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Saving..."
              : screenplay
                ? "Save Revision"
                : "Save Screenplay"}
          </button>

        </div>

      </header>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

        <label
          htmlFor="screenplay-title"
          className="text-xs uppercase tracking-[0.3em] text-zinc-500"
        >
          Screenplay Title
        </label>

        <input
          id="screenplay-title"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          className="mt-3 w-full border-none bg-transparent text-3xl font-bold outline-none placeholder:text-zinc-700"
          placeholder="Untitled Screenplay"
        />

      </section>

      <ScriptImport
        processing={processing}
        onImport={importScript}
      />

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">

        {fileName && (
          <div className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-400">
            Source: {fileName}
          </div>
        )}

        {screenplay && (
          <div className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-400">
            Version{" "}
            {screenplay.version}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setIntelligenceOpen(
              (current) =>
                !current
            )
          }
          className="rounded-xl border border-zinc-700 px-5 py-3 transition hover:border-yellow-500"
        >
          {intelligenceOpen
            ? "Hide Intelligence"
            : "Show Intelligence"}
        </button>

        <button
          type="button"
          onClick={() =>
            setHistoryOpen(
              (current) =>
                !current
            )
          }
          className="rounded-xl border border-zinc-700 px-5 py-3 transition hover:border-yellow-500"
        >
          {historyOpen
            ? "Hide History"
            : `Revision History (${revisions.length})`}
        </button>

        {(content ||
          analysis ||
          knowledge) && (
          <button
            type="button"
            onClick={clear}
            disabled={
              processing ||
              saving
            }
            className="rounded-xl border border-zinc-700 px-5 py-3 text-zinc-300 transition hover:border-red-500 hover:text-red-400 disabled:opacity-50"
          >
            Clear Workspace
          </button>
        )}

      </div>

      <div
        className={
          intelligenceOpen
            ? "grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]"
            : "grid gap-8"
        }
      >

        <ScriptEditor
          value={content}
          onChange={setContent}
          disabled={
            processing ||
            saving
          }
        />

        {intelligenceOpen && (
          <ScriptIntelligencePanel
            analysis={analysis}
            processing={
              processing
            }
          />
        )}

      </div>

      {historyOpen && (
        <ScriptRevisionHistory
          revisions={revisions}
        />
      )}

      {knowledge && (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

          <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
            Production Knowledge
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Script Context Extracted
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">
                Characters
              </p>

              <p className="mt-2 text-3xl font-bold">
                {
                  knowledge
                    .characters
                    .length
                }
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">
                Scenes
              </p>

              <p className="mt-2 text-3xl font-bold">
                {
                  knowledge
                    .scenes
                    .length
                }
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">
                Acts
              </p>

              <p className="mt-2 text-3xl font-bold">
                {
                  knowledge
                    .screenplay
                    .acts
                }
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">
                Source
              </p>

              <p className="mt-2 text-lg font-semibold uppercase">
                {
                  knowledge
                    .screenplay
                    .source
                }
              </p>
            </div>

          </div>

        </section>
      )}

    </div>
  );
}

export default function ScriptWorkspace({
  productionId,
}: ScriptWorkspaceProps) {
  return (
    <SaveProvider>
      <ScriptWorkspaceContent
        productionId={
          productionId
        }
      />
    </SaveProvider>
  );
}