"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

interface NavigationItem { label: string; path: string; description: string; }

const navigation: NavigationItem[] = [
  { label: "Overview", path: "", description: "Production overview" },
  { label: "Screenplay", path: "/screenplay", description: "Screenplay Editor" },
  { label: "Story Bible", path: "/story-bible", description: "Story foundation" },
  { label: "Characters", path: "/characters", description: "Character Bible" },
  { label: "Locations", path: "/locations", description: "Location Bible" },
  { label: "World Building", path: "/world-building", description: "Production universe" },
  { label: "Scenes", path: "/scenes", description: "Scene Planner" },
  { label: "Storyboard", path: "/storyboard", description: "Storyboard Builder" },
  { label: "Shot List", path: "/shot-list", description: "Production Shots" },
  { label: "AI Director", path: "/ai-director", description: "Production Assistant" },
  { label: "Assets", path: "/assets", description: "Production Assets" },
  { label: "Render", path: "/render", description: "Render Production" },
  { label: "Export", path: "/export", description: "Export Production" },
];

export default function ProductionSidebar() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const basePath = `/studio/productions/${params.id}`;
  const activeItem = navigation.find((item) => pathname === `${basePath}${item.path}`) ?? navigation[0];

  const links = navigation.map((item) => {
    const href = `${basePath}${item.path}`;
    const active = item.path === "" ? pathname === basePath : pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        key={item.label}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileNavigationOpen(false)}
        className={`block rounded-xl px-4 py-3 transition ${active ? "bg-yellow-500 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
      >
        <div className="font-medium">{item.label}</div>
        <div className={`mt-1 text-xs ${active ? "text-black/60" : "text-zinc-500"}`}>{item.description}</div>
      </Link>
    );
  });

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-900 lg:block">
        <div className="border-b border-zinc-800 p-6"><p className="text-xs uppercase tracking-[0.3em] text-yellow-500">Production</p><h2 className="mt-2 text-lg font-bold">Workspace</h2></div>
        <nav aria-label="Production sections" className="h-[calc(100vh-93px)] space-y-1 overflow-y-auto p-4">
          {links}
        </nav>
      </aside>

      <div className="border-b border-zinc-800 bg-zinc-900 p-3 lg:hidden">
        <button
          type="button"
          aria-expanded={mobileNavigationOpen}
          aria-controls="production-mobile-navigation"
          onClick={() => setMobileNavigationOpen((open) => !open)}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-zinc-700 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
        >
          <span className="text-sm font-semibold">Navigate production</span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-yellow-400">{activeItem.label}</span>
            <span aria-hidden="true" className="text-zinc-400">{mobileNavigationOpen ? "−" : "+"}</span>
          </span>
        </button>
        {mobileNavigationOpen ? (
          <nav id="production-mobile-navigation" aria-label="Production sections" className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2">
            {links}
          </nav>
        ) : null}
      </div>
    </>
  );
}
