export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-4xl text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-yellow-500 font-semibold">
          Skillmid Creatives
        </p>

        <h1 className="mt-6 text-5xl md:text-7xl font-extrabold leading-tight">
          Kingdom Studio AI
        </h1>

        <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto">
          Turn Stories Into Cinema.
        </p>

        <p className="mt-4 text-gray-400 max-w-3xl mx-auto leading-8">
          Create cinematic films from Bible stories, sermons, scripts, books,
          and original ideas using the power of Artificial Intelligence.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl transition">
            Start Creating
          </button>

          <button className="border border-gray-700 hover:border-yellow-500 px-8 py-4 rounded-xl transition">
            Learn More
          </button>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-zinc-900 p-6">
            <h3 className="text-xl font-bold">📖 Story to Scenes</h3>
            <p className="text-gray-400 mt-2">
              Automatically break stories into cinematic scenes.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6">
            <h3 className="text-xl font-bold">🎬 AI Video Generation</h3>
            <p className="text-gray-400 mt-2">
              Generate stunning videos powered by AI.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-6">
            <h3 className="text-xl font-bold">🎥 Movie Builder</h3>
            <p className="text-gray-400 mt-2">
              Combine scenes into complete cinematic productions.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}