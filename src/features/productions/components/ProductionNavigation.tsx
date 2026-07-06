"use client";

const tabs = [
  "Overview",
  "Story Bible",
  "Characters",
  "Scenes",
  "Assets",
  "AI Director",
  "Settings",
];

interface ProductionNavigationProps {
  activeTab?: string;
}

export default function ProductionNavigation({
  activeTab = "Overview",
}: ProductionNavigationProps) {
  return (
    <nav className="sticky top-20 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">

      <div className="flex gap-2 overflow-x-auto px-10 py-4">

        {tabs.map((tab) => {

          const active =
            tab === activeTab;

          return (

            <button
              key={tab}
              type="button"
              className={`rounded-xl px-5 py-2 text-sm font-medium transition ${
                active
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {tab}
            </button>

          );

        })}

      </div>

    </nav>
  );
}