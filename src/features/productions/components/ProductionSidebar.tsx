import Link from "next/link";

const navigation = [
  "Overview",
  "Kingdom Vision",
  "Story",
  "Characters",
  "Scenes",
  "Assets",
  "AI Director",
  "Voice",
  "Render",
  "Settings",
];

export default function ProductionSidebar() {
  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-900">

      <nav className="space-y-2 p-6">

        {navigation.map((item) => (

          <Link
            key={item}
            href="#"
            className="block rounded-xl px-4 py-3 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            {item}
          </Link>

        ))}

      </nav>

    </aside>
  );
}