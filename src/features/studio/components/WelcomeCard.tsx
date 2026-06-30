export default function WelcomeCard() {
  const currentHour = new Date().getHours();

  let greeting = "Good Evening";

  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 18) {
    greeting = "Good Afternoon";
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-10">

      <p className="text-sm uppercase tracking-[0.25em] text-yellow-500">
        Kingdom Studio AI
      </p>

      <h1 className="mt-4 text-4xl font-bold">
        {greeting} 👋
      </h1>

      <p className="mt-4 text-xl font-semibold">
        Welcome back.
      </p>

      <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-400">
        Continue building stories that glorify Christ, inspire people,
        and communicate biblical truth through cinematic excellence.
      </p>

    </section>
  );
}