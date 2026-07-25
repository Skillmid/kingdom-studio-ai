"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useCreateProduction } from "../hooks/use-create-production";

interface CreateProductionDialogProps {
  onClose?: () => void;
}

export default function CreateProductionDialog({
  onClose,
}: CreateProductionDialogProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");

  const { create, loading } =
    useCreateProduction();

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const result =
      await create(title);

    if (!result.success) {
      window.alert(result.error);
      return;
    }

    if (!result.production) {
      window.alert(
        "Production was created but no production data was returned."
      );
      return;
    }

    setTitle("");

    onClose?.();

    router.push(
      `/studio/productions/${result.production.id}`
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <input
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        placeholder="Production title"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-yellow-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
      >
        {loading
          ? "Creating Production..."
          : "Create Production"}
      </button>
    </form>
  );
}