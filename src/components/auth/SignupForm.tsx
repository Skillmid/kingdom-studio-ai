"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    console.log({
      fullName,
      email,
      password,
    });

    // Supabase authentication comes next.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <div>
        <label
          htmlFor="fullName"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Full Name
        </label>

        <input
          id="fullName"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-500"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Email Address
        </label>

        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-yellow-500"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black transition hover:bg-yellow-400"
      >
        Create Account
      </button>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-yellow-500 hover:text-yellow-400"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}