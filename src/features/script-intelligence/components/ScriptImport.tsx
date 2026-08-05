"use client";

import {
  useRef,
  useState,
} from "react";

import type {
  ImportFileType,
} from "@/features/import-engine";

interface ScriptImportProps {
  processing: boolean;

  onImport: (input: {
    name: string;
    type: ImportFileType;
    content: string;
  }) => Promise<unknown>;
}

function detectFileType(
  fileName: string
): ImportFileType | null {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase();

  switch (extension) {
    case "txt":
      return "txt";

    case "fountain":
      return "fountain";

    case "md":
    case "markdown":
      return "markdown";

    case "fdx":
      return "fdx";

    case "pdf":
      return "pdf";

    case "docx":
      return "docx";

    default:
      return null;
  }
}

function canReadAsText(
  type: ImportFileType
) {
  return (
    type === "txt" ||
    type === "fountain" ||
    type === "markdown" ||
    type === "fdx"
  );
}

export default function ScriptImport({
  processing,
  onImport,
}: ScriptImportProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    pasteOpen,
    setPasteOpen,
  ] = useState(false);

  const [
    pastedScript,
    setPastedScript,
  ] = useState("");

  const [
    localError,
    setLocalError,
  ] = useState<string | null>(
    null
  );

  async function handleFile(
    file: File
  ) {
    setLocalError(null);

    const type =
      detectFileType(file.name);

    if (!type) {
      setLocalError(
        "Unsupported screenplay file type."
      );

      return;
    }

    if (!canReadAsText(type)) {
      setLocalError(
        `${type.toUpperCase()} import is prepared but binary extraction is not connected yet. Use Paste Script, TXT, Fountain, Markdown, or FDX for now.`
      );

      return;
    }

    try {
      const content =
        await file.text();

      if (!content.trim()) {
        setLocalError(
          "The selected screenplay file is empty."
        );

        return;
      }

      await onImport({
        name: file.name,
        type,
        content,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Unable to import screenplay."
      );
    }
  }

  async function handlePaste() {
    const content =
      pastedScript.trim();

    if (!content) {
      setLocalError(
        "Paste a screenplay before adding it to the editor."
      );

      return;
    }

    setLocalError(null);

    try {
      await onImport({
        name: "pasted-screenplay.txt",
        type: "txt",
        content,
      });

      setPastedScript("");

      setPasteOpen(false);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Unable to process pasted screenplay."
      );
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
            Script Source
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Add Screenplay
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Choose an existing screenplay
            file or paste a complete script.
            The screenplay will be placed
            into the editor below for review
            before you save it to the
            production.
          </p>

        </div>

        <div className="flex flex-wrap gap-3">

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.fountain,.md,.markdown,.fdx,.pdf,.docx"
            className="hidden"
            onChange={async (
              event
            ) => {
              const file =
                event.target
                  .files?.[0];

              if (file) {
                await handleFile(
                  file
                );
              }

              event.target.value =
                "";
            }}
          />

          <button
            type="button"
            disabled={processing}
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="rounded-xl border border-zinc-700 px-5 py-3 font-medium transition hover:border-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Choose File
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={() => {
              setLocalError(null);

              setPasteOpen(
                (current) =>
                  !current
              );
            }}
            className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pasteOpen
              ? "Close Paste"
              : "Paste Script"}
          </button>

        </div>

      </div>

      {pasteOpen && (
        <div className="mt-6 space-y-4 border-t border-zinc-800 pt-6">

          <div>

            <h3 className="font-semibold">
              Paste Screenplay
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Paste the complete screenplay
              below. It will be added to the
              main screenplay editor before
              saving.
            </p>

          </div>

          <textarea
            value={pastedScript}
            disabled={processing}
            onChange={(event) =>
              setPastedScript(
                event.target.value
              )
            }
            placeholder="Paste the complete screenplay here..."
            spellCheck
            className="min-h-[320px] w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-5 font-mono text-sm leading-7 outline-none transition focus:border-yellow-500 disabled:opacity-60"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs text-zinc-500">
              Adding the screenplay does not
              save it to the production. Review
              it in the editor, then use Save
              Screenplay.
            </p>

            <button
              type="button"
              disabled={
                processing ||
                !pastedScript.trim()
              }
              onClick={
                handlePaste
              }
              className="shrink-0 rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Processing..."
                : "Add to Screenplay"}
            </button>

          </div>

        </div>
      )}

      {localError && (
        <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
          {localError}
        </div>
      )}

    </section>
  );
}