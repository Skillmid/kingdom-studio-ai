"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "@/services/auth/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

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
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-500"
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
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="text-yellow-500"
        >
          Create one
        </Link>
      </p>

    </form>
  );
}