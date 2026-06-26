"use client";

export default function SignupForm() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
      <h1 className="text-3xl font-bold text-white">
        Create your account
      </h1>

      <p className="mt-2 text-neutral-400">
        Welcome to Kingdom Studio AI
      </p>

      <form className="mt-8 space-y-5">

        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white outline-none"
        />

        <button
          className="w-full rounded-lg bg-white py-3 font-semibold text-black transition hover:opacity-90"
        >
          Create Account
        </button>

      </form>
    </div>
  );
}