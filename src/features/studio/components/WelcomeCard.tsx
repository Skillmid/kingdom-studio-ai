"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export default function WelcomeCard() {
  const { user } =
    useCurrentUser();

  const currentHour =
    new Date().getHours();

  let greeting =
    "Good Evening";

  if (currentHour < 12) {
    greeting =
      "Good Morning";
  } else if (
    currentHour < 18
  ) {
    greeting =
      "Good Afternoon";
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-10">

      <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
        Kingdom Studio AI
      </p>

      <h1 className="mt-4 text-5xl font-bold">
        {greeting},{" "}
        {user?.full_name ??
          "Creator"}{" "}
        👋
      </h1>

      <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
        Develop a meaningful story, then shape its screenplay, characters, and
        scenes into a cinematic production. Your creative decisions stay yours;
        AI helps with the work around them.
      </p>

    </section>
  );
}
