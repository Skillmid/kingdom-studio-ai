"use client";

import Link from "next/link";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export default function StudioHeader() {
  const { user } = useCurrentUser();

  return (
    <header className="flex min-h-20 flex-col gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-0">

      <div>

        <h2 className="text-xl font-semibold sm:text-2xl">
          Studio
        </h2>

        <p className="text-sm text-zinc-400">
          Welcome back,{" "}
          <span className="font-semibold text-white">
            {user?.full_name ?? "Creator"}
          </span>.
        </p>

      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4">

        <Link
          href="/studio/notifications"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm transition hover:border-yellow-500 hover:bg-zinc-900"
        >
          Notifications
        </Link>

        <Link
          href="/studio/profile"
          className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-black transition hover:bg-yellow-400"
        >
          My Profile
        </Link>

      </div>

    </header>
  );
}