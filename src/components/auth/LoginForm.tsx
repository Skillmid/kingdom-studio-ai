"use client";

import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
      <h1 className="text-3xl font-bold text-white">
        Welcome Back
      </h1>

      <p className="mt-2 text-neutral-400">
        Sign in to Kingdom Studio AI
      </p>

      <form className="mt-8 space-y-5">

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-white py-3 font-semibold text-black"
        >
          Sign In
        </button>

      </form>

      <p className="mt-6 text-center text-sm text-neutral-400">
        Don't have an account?{" "}
        <a
          href="/signup"
          className="text-white underline"
        >
          Create one
        </a>
      </p>
    </div>
  );
}