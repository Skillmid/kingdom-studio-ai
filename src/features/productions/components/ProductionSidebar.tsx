"use client";

import Link from "next/link";
import {
  useParams,
  usePathname,
} from "next/navigation";

interface NavigationItem {
  label: string;
  path: string;
  description: string;
}

const navigation: NavigationItem[] = [
  {
    label: "Overview",
    path: "",
    description: "Production overview",
  },
  {
    label: "Story Bible",
    path: "/story-bible",
    description: "Story foundation",
  },
  {
    label: "Characters",
    path: "/characters",
    description: "Character Bible",
  },
  {
    label: "Locations",
    path: "/locations",
    description: "Location Bible",
  },
  {
    label: "Scenes",
    path: "/scenes",
    description: "Scene Planner",
  },
  {
    label: "Screenplay",
    path: "/screenplay",
    description: "Screenplay Editor",
  },
  {
    label: "Storyboard",
    path: "/storyboard",
    description: "Storyboard Builder",
  },
  {
    label: "Shot List",
    path: "/shot-list",
    description: "Production Shots",
  },
  {
    label: "AI Director",
    path: "/ai-director",
    description: "Production Assistant",
  },
  {
    label: "Assets",
    path: "/assets",
    description: "Production Assets",
  },
  {
    label: "Render",
    path: "/render",
    description: "Render Production",
  },
  {
    label: "Export",
    path: "/export",
    description: "Export Production",
  },
];

export default function ProductionSidebar() {
  const pathname = usePathname();

  const params = useParams<{
    id: string;
  }>();

  const productionId =
    params.id;

  const basePath =
    `/studio/productions/${productionId}`;

  return (
    <aside className="sticky top-0 h-screen w-72 shrink-0 border-r border-zinc-800 bg-zinc-900">

      <div className="border-b border-zinc-800 p-6">

        <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
          Production
        </p>

        <h2 className="mt-2 text-lg font-bold">
          Workspace
        </h2>

      </div>

      <nav className="h-[calc(100vh-93px)] space-y-1 overflow-y-auto p-4">

        {navigation.map((item) => {
          const href =
            `${basePath}${item.path}`;

          const active =
            item.path === ""
              ? pathname === basePath
              : pathname === href ||
                pathname.startsWith(
                  `${href}/`
                );

          return (
            <Link
              key={item.label}
              href={href}
              className={`block rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <div className="font-medium">
                {item.label}
              </div>

              <div
                className={`mt-1 text-xs ${
                  active
                    ? "text-black/60"
                    : "text-zinc-500"
                }`}
              >
                {item.description}
              </div>
            </Link>
          );
        })}

      </nav>

    </aside>
  );
}