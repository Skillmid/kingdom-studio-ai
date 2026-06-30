"use client";

import { useState } from "react";

import { useCreateProduction } from "../hooks/use-create-production";

export default function CreateProductionDialog() {
  const [title, setTitle] = useState("");

  const { create, loading } =
    useCreateProduction();

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const result = await create(title);

    if (!result.success) {
      alert(result.error);
      return;
    }

    alert("Production created!");

    setTitle("");
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
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-yellow-500 px-5 py-3 font-semibold text-black"
      >
        {loading
          ? "Creating..."
          : "Create Production"}
      </button>
    </form>
  );
}