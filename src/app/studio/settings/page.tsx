import StudioLayout from "@/features/studio/components/StudioLayout";

const settings = [
  {
    title: "Profile",
    description:
      "Manage your personal information and account details.",
  },
  {
    title: "Security",
    description:
      "Update your password and account security.",
  },
  {
    title: "Appearance",
    description:
      "Customize your Studio experience.",
  },
  {
    title: "Notifications",
    description:
      "Choose how Kingdom Studio AI notifies you.",
  },
  {
    title: "AI Preferences",
    description:
      "Configure AI Director behavior and defaults.",
  },
  {
    title: "Production Defaults",
    description:
      "Default language, aspect ratio and production settings.",
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

          {settings.map((setting) => (

            <button
              key={setting.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-left transition duration-300 hover:border-yellow-500 hover:bg-zinc-800"
            >

              <h2 className="text-2xl font-semibold">
                {setting.title}
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                {setting.description}
              </p>

            </button>

          ))}

        </div>

      </section>

    </StudioLayout>
  );
}