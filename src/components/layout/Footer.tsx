export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Kingdom Studio AI
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            Built by Skillmid Creatives
          </p>
        </div>

        <div className="text-sm text-zinc-500">
          Version 0.1.0 Alpha
        </div>
      </div>
    </footer>
  );
}