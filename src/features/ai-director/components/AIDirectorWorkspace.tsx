export default function AIDirectorWorkspace() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">Kingdom Studio AI</p>
        <h1 className="mt-4 text-5xl font-bold">AI Director</h1>
        <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-400">
          Production intelligence lives on a production. Open a project to plan scene intent,
          blocking, camera, lighting, pacing, sound and continuity from persisted scenes, shots
          and storyboard panels. The director proposes; the filmmaker approves.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="text-2xl font-semibold">How directing notes are built</h2>
        <ul className="mt-6 space-y-3 text-zinc-400">
          <li>Scene intent comes from purpose, story beat and summary — never invented plot.</li>
          <li>Camera and composition come from Shot List and Storyboard coverage.</li>
          <li>Lighting uses recorded time of day and explicit light language in scene text.</li>
          <li>Approved notes survive later planning runs.</li>
        </ul>
      </section>
    </div>
  );
}
