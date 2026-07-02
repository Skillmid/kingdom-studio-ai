export default function ProductionStats() {
  const cards = [
    {
      title: "Characters",
      value: 0,
    },
    {
      title: "Scenes",
      value: 0,
    },
    {
      title: "Assets",
      value: 0,
    },
    {
      title: "Progress",
      value: "0%",
    },
  ];

  return (
    <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      {cards.map((card) => (

        <div
          key={card.title}
          className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
        >

          <p className="text-zinc-400">
            {card.title}
          </p>

          <h2 className="mt-4 text-5xl font-bold">
            {card.value}
          </h2>

        </div>

      ))}

    </section>
  );
}