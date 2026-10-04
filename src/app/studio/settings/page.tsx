import Link from "next/link";
import StudioLayout from "@/features/studio/components/StudioLayout";

interface SettingItem {
  title: string;
  description: string;
  href?: string;
  badge: string;
}

const settings: SettingItem[] = [
  {
    title: "Profile",
    description:
      "Manage your personal creator profile, workspace role, and account details.",
    href: "/studio/profile",
    badge: "Open Profile",
  },
  {
    title: "Notifications",
    description:
      "Review production alerts, generation updates, and director notifications.",
    href: "/studio/notifications",
    badge: "Open Notifications",
  },
  {
    title: "AI Preferences",
    description:
      "Review AI Director assistance models, creative suggestions, and generation limits.",
    href: "/studio/ai-director",
    badge: "AI Director",
  },
  {
    title: "Production Defaults",
    description:
      "Manage your project defaults, aspect ratios, and production workspace.",
    href: "/studio/productions",
    badge: "View Projects",
  },
  {
    title: "Appearance",
    description:
      "Kingdom Studio AI is crafted in Dark Cinema theme with Gold Accents.",
    badge: "Dark Cinema (Active)",
  },
  {
    title: "Security",
    description:
      "Session authentication and database row-level security are managed via Supabase.",
    badge: "Supabase Protected",
  },
];

export default function SettingsPage() {
  return (
    <StudioLayout>

      <section>

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          Settings
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
          Configure your Kingdom Studio AI experience and account
          preferences.
        </p>

      </section>

      <section className="mt-10">

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {settings.map((setting) => {
            const content = (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold">
                      {setting.title}
                    </h2>
                    <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-300">
                      {setting.badge}
                    </span>
                  </div>

                  <p className="mt-4 leading-7 text-zinc-400">
                    {setting.description}
                  </p>
                </div>

                {setting.href ? (
                  <div className="mt-6 flex items-center text-sm font-semibold text-yellow-500 group-hover:text-yellow-400">
                    <span>Go to {setting.title}</span>
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                ) : null}
              </div>
            );

            if (setting.href) {
              return (
                <Link
                  key={setting.title}
                  href={setting.href}
                  className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-left transition duration-300 hover:border-yellow-500 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={setting.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-left"
              >
                {content}
              </div>
            );
          })}

        </div>

      </section>

    </StudioLayout>
  );
}