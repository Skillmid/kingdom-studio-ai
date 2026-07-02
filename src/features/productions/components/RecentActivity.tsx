export default function RecentActivity() {
  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
        Activity
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        Recent Activity
      </h2>

      <div className="mt-8 space-y-6">

        <div className="rounded-2xl border border-zinc-800 p-6">
          <h3 className="font-semibold">
            Production Created
          </h3>

          <p className="mt-2 text-zinc-400">
            Your Kingdom production has been created successfully.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 p-6">
          <h3 className="font-semibold">
            Next Step
          </h3>

          <p className="mt-2 text-zinc-400">
            Complete your Kingdom Vision before writing your screenplay.
          </p>
        </div>

      </div>

    </section>
  );
}