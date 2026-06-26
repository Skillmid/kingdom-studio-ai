import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-500">
            Skillmid Creatives
          </span>

          <span className="text-lg font-bold text-white">
            Kingdom Studio AI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-zinc-300 transition hover:text-white"
          >
            Features
          </Link>

          <Link
            href="#vision"
            className="text-sm text-zinc-300 transition hover:text-white"
          >
            Vision
          </Link>

          <Link
            href="/login"
            className="text-sm text-zinc-300 transition hover:text-white"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
          >
            Start Creating
          </Link>
        </nav>
      </div>
    </header>
  );
}