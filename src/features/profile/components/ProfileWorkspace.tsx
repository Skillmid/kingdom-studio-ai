"use client";

import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { signOut } from "@/services/auth/auth";

export default function ProfileWorkspace() {
  const router = useRouter();

  const { user, loading } =
    useCurrentUser();

  async function handleSignOut() {
    await signOut();

    router.replace("/login");
  }

  if (loading) {
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
          Manage your Kingdom Studio account.
        </p>

      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">

        <div className="flex items-center gap-6">

          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500 text-4xl font-bold text-black">

            {user?.user_metadata?.full_name
              ?.charAt(0)
              ?.toUpperCase() ?? "U"}

          </div>

          <div>

            <h2 className="text-3xl font-bold">
              {user?.user_metadata?.full_name ??
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

          <h3 className="text-4xl font-bold">
            —
          </h3>

          <p className="mt-3 text-zinc-400">
            Productions
          </p>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

          <h3 className="text-4xl font-bold">
            —
          </h3>

          <p className="mt-3 text-zinc-400">
            Characters
          </p>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

          <h3 className="text-4xl font-bold">
            —
          </h3>

          <p className="mt-3 text-zinc-400">
            Scenes
          </p>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

          <h3 className="text-4xl font-bold">
            —
          </h3>

          <p className="mt-3 text-zinc-400">
            AI Requests
          </p>

        </div>

      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">

        <h2 className="text-2xl font-semibold">
          Account
        </h2>

        <div className="mt-8 flex gap-4">

          <button
            className="rounded-2xl border border-zinc-700 px-6 py-3 transition hover:border-yellow-500"
          >
            Edit Profile
          </button>

          <button
            className="rounded-2xl border border-zinc-700 px-6 py-3 transition hover:border-yellow-500"
          >
            Change Password
          </button>

          <button
            onClick={handleSignOut}
            className="rounded-2xl bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-500"
          >
            Sign Out
          </button>

        </div>

      </section>

    </div>
  );
}