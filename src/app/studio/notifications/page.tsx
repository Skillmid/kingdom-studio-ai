import StudioLayout from "@/features/studio/components/StudioLayout";

const notifications = [
  {
    title: "Welcome to Kingdom Studio AI",
    description:
      "Your creative filmmaking platform is ready.",
    time: "Just now",
  },
  {
    title: "Production Updated",
    description:
      "Recent production activity will appear here.",
    time: "Today",
  },
  {
    title: "AI Director",
    description:
      "Future AI generations and suggestions will appear here.",
    time: "Coming Soon",
  },
];

export default function NotificationsPage() {
  return (
    <StudioLayout>

      <section>

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-4 text-5xl font-bold">
          Notifications
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
          Stay informed about production activity,
          AI updates, rendering progress and
          important account events.
        </p>

      </section>

      <section className="mt-10 space-y-5">

        {notifications.map((notification) => (

          <div
            key={notification.title}
            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
          >

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-semibold">
                {notification.title}
              </h2>

              <span className="text-sm text-zinc-500">
                {notification.time}
              </span>

            </div>

            <p className="mt-4 leading-7 text-zinc-400">
              {notification.description}
            </p>

          </div>

        ))}

      </section>

    </StudioLayout>
  );
}