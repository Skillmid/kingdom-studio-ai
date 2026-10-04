"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavigationItem {
  title: string;
  href: string;
}

const navigation: NavigationItem[] = [
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
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/studio") {
      return pathname === "/studio";
    }

    return pathname.startsWith(href);
  }

  const activeItem =
    navigation.find((item) => isActive(item.href)) ?? navigation[0];

  const links = navigation.map((item) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.title}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileNavigationOpen(false)}
        className={`block rounded-xl px-4 py-3 transition ${
          active
            ? "bg-yellow-500 font-semibold text-black"
            : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        {item.title}
      </Link>
    );
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 lg:flex">
        <div className="border-b border-zinc-800 p-8">
          <h1 className="text-2xl font-bold text-yellow-500">
            Kingdom Studio
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Kingdom Filmmaking Platform
          </p>
        </div>

        <nav aria-label="Studio sections" className="flex-1 space-y-2 overflow-y-auto p-6">
          {links}
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

      {/* Mobile Navigation */}
      <div className="border-b border-zinc-800 bg-zinc-900 p-3 lg:hidden">
        <button
          type="button"
          aria-expanded={mobileNavigationOpen}
          aria-controls="studio-mobile-navigation"
          onClick={() => setMobileNavigationOpen((open) => !open)}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-zinc-700 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
        >
          <span className="text-sm font-semibold">Navigate Studio</span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-yellow-400">
              {activeItem.title}
            </span>
            <span aria-hidden="true" className="text-zinc-400">
              {mobileNavigationOpen ? "−" : "+"}
            </span>
          </span>
        </button>

        {mobileNavigationOpen ? (
          <nav
            id="studio-mobile-navigation"
            aria-label="Studio sections"
            className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2"
          >
            {links}
          </nav>
        ) : null}
      </div>
    </>
  );
}