"use client";

import { useEffect, useRef, useState } from "react";

interface ProductionCardMenuProps {
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ProductionCardMenu({
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: ProductionCardMenuProps) {
  const [open, setOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <button
        onClick={() =>
          setOpen((value) => !value)
        }
        className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">

          <button
            onClick={() =>
              run(onOpen)
            }
            className="block w-full px-5 py-3 text-left hover:bg-zinc-800"
          >
            Open
          </button>

          <button
            onClick={() =>
              run(onRename)
            }
            className="block w-full px-5 py-3 text-left hover:bg-zinc-800"
          >
            Rename
          </button>

          <button
            onClick={() =>
              run(onDuplicate)
            }
            className="block w-full px-5 py-3 text-left hover:bg-zinc-800"
          >
            Duplicate
          </button>

          <hr className="border-zinc-800" />

          <button
            onClick={() =>
              run(onDelete)
            }
            className="block w-full px-5 py-3 text-left text-red-400 hover:bg-red-950/40"
          >
            Delete
          </button>

        </div>
      )}

    </div>
  );
}