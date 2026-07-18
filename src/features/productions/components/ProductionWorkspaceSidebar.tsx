"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProductionWorkspaceSidebarProps {
  productionId: string;
}

const navigation = [
  {
    title: "Overview",
    href: "",
  },
  {
    title: "Story Bible",
    href: "story-bible",
  },
  {
    title: "Characters",
    href: "characters",
  },
  {
    title: "Locations",
    href: "locations",
  },
  {
    title: "World Building",
    href: "world-building",
  },
  {
    title: "Scenes",
    href: "scenes",
  },
  {
    title: "Screenplay",
    href: "screenplay",
  },
  {
    title: "Storyboard",
    href: "storyboard",
  },
  {
    title: "Shot List",
    href: "shot-list",
  },
  {
    title: "AI Director",
    href: "ai-director",
  },
  {
    title: "Assets",
    href: "assets",
  },
  {
    title: "Render Queue",
    href: "render",
  },
  {
    title: "Export",
    href: "export",
  },
];

export default function ProductionWorkspaceSidebar({
  productionId,
}: ProductionWorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-900">

      <div className="border-b border-zinc-800 p-6">

        <h2 className="text-xl font-bold">
          Production
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Creative Workspace
        </p>

      </div>

      <nav className="space-y-2 p-4">

        {navigation.map((item) => {
          const href =
            item.href === ""
              ? `/studio/productions/${productionId}`
              : `/studio/productions/${productionId}/${item.href}`;

          const active =
            pathname === href;

          return (
            <Link
              key={item.title}
              href={href}
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

    </aside>
  );
}