export default function NextSteps() {
  const steps = [
    "Complete Kingdom Vision",
    "Create Story Outline",
    "Add Main Characters",
    "Write First Scene",
    "Generate Storyboard",
  ];

  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
        Workflow
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        Next Steps
      </h2>

      <div className="mt-8 space-y-4">

        {steps.map((step, index) => (

          <div
            key={step}
            className="flex items-center gap-4 rounded-xl border border-zinc-800 p-5"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 font-bold text-black">
              {index + 1}
            </div>

            <span className="text-lg">
              {step}
            </span>

          </div>

        ))}

      </div>

    </section>
  );
}