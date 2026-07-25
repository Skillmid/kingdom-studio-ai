interface ExportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExportPage({
  params,
}: ExportPageProps) {
  await params;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Export</h1>

      <p className="mt-4 text-zinc-400">
        Export and package your production for delivery.
      </p>
    </div>
  );
}