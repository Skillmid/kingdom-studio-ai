"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export default function StudioHeader() {
  const { user } = useCurrentUser();

  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-8">

      <div>

        <h2 className="text-2xl font-semibold">
          Studio
        </h2>

        <p className="text-sm text-zinc-400">
          Welcome back,{" "}
          <span className="font-semibold text-white">
            {user?.full_name ?? "Creator"}
          </span>
          .
        </p>

      </div>

      <div className="flex items-center gap-4">

        <button className="rounded-xl border border-zinc-700 px-4 py-2 text-sm transition hover:border-yellow-500">
          Notifications
        </button>

        <button className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-black">
          My Profile
        </button>

      </div>

    </header>
  );
}