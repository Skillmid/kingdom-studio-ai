"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/studio") {
      return pathname === "/studio";
    }

    return pathname.startsWith(href);
  }

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-900">

      <div className="border-b border-zinc-800 p-8">

        <h1 className="text-2xl font-bold text-yellow-500">
          Kingdom Studio
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          Kingdom Filmmaking Platform
        </p>

      </div>

      <nav className="flex-1 space-y-2 p-6">

        {navigation.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`block rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-yellow-500 font-semibold text-black"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.title}
            </Link>
          );
        })}

      </nav>

      <div className="border-t border-zinc-800 p-6">

        <p className="text-xs text-zinc-500">
          Kingdom Studio AI
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Version 1.0.0
        </p>

      </div>

    </aside>
  );
}