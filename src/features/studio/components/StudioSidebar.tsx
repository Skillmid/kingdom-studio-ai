import Link from "next/link";

const navigation = [
  {
    title: "Dashboard",
    href: "/studio",
  },
  {
    title: "Productions",
    href: "/studio/productions",
  },
  {
    title: "Templates",
    href: "/studio/templates",
  },
  {
    title: "Global Assets",
    href: "/studio/assets",
  },
  {
    title: "Settings",
    href: "/studio/settings",
  },
];

export default function StudioSidebar() {
  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-900">

      <div className="border-b border-zinc-800 p-8">

        <h1 className="text-2xl font-bold text-yellow-500">
          Kingdom Studio
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          Kingdom Filmmaking Platform
        </p>

      </div>

      <nav className="space-y-2 p-6">

        {navigation.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            {item.title}
          </Link>
        ))}

      </nav>

    </aside>
  );
}