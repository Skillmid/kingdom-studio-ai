"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useProductions } from "@/features/productions/hooks/use-productions";
import { signOut } from "@/services/auth/auth";

export default function ProfileWorkspace() {
  const router = useRouter();

  const { user, loading: loadingUser } = useCurrentUser();
  const { productions, loading: loadingProductions } = useProductions();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (loadingUser) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-12">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          My Profile
        </h1>

        <p className="mt-6 text-lg text-zinc-400">
          Manage your Kingdom Studio account and creative workspace.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500 text-4xl font-bold text-black">
            {user?.full_name
              ?.charAt(0)
              ?.toUpperCase() ?? "U"}
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              {user?.full_name ??
                "Kingdom Creator"}
            </h2>

            <p className="mt-2 text-zinc-400">
              {user?.email}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h3 className="text-4xl font-bold text-yellow-500">
            {loadingProductions ? "..." : productions.length}
          </h3>

          <p className="mt-3 text-zinc-400">
            Active Productions
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h3 className="text-2xl font-bold text-zinc-100">
            Creator Led
          </h3>

          <p className="mt-3 text-zinc-400">
            Creative Direction
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h3 className="text-2xl font-bold text-zinc-100">
            Studio
          </h3>

          <p className="mt-3 text-zinc-400">
            Workspace Edition
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h3 className="text-2xl font-bold text-green-400">
            Active
          </h3>

          <p className="mt-3 text-zinc-400">
            Account Status
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">
        <h2 className="text-2xl font-semibold">
          Account &amp; Workspace
        </h2>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/studio/settings"
            className="rounded-2xl border border-zinc-700 px-6 py-3 font-semibold transition hover:border-yellow-500 hover:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
          >
            Studio Settings
          </Link>

          <Link
            href="/studio/productions"
            className="rounded-2xl border border-zinc-700 px-6 py-3 font-semibold transition hover:border-yellow-500 hover:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
          >
            View Productions
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}