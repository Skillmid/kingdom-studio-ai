"use client";

import ProductionCard from "@/features/productions/components/ProductionCard";
import { useProductions } from "@/features/productions/hooks/use-productions";

import StudioToolbar from "./StudioToolbar";

export default function RecentProductions() {
  const {
    productions,
    loading,

    search,
    setSearch,

    sort,
    setSort,

    deleteProduction,
    renameProduction,
    duplicateProduction,
  } = useProductions();

  if (loading) {
    return (
      <section className="mt-10">

        <StudioToolbar
          total={0}
          search=""
          sort="updated"
          onSearch={() => {}}
          onSort={() => {}}
        />

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-16 text-center">
          Loading productions...
        </div>

      </section>
    );
  }

  return (
    <section className="mt-10">

      <StudioToolbar
        total={productions.length}
        search={search}
        sort={sort}
        onSearch={setSearch}
        onSort={setSort}
      />

      {productions.length === 0 ? (

        <div className="mt-6 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-20 text-center">

          <h3 className="text-3xl font-bold">
            No Productions
          </h3>

          <p className="mt-4 text-zinc-400">
            Create your first Kingdom production.
          </p>

        </div>

      ) : (

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {productions.map((production) => (

            <ProductionCard
              key={production.id}
              production={production}
              onDeleted={() =>
                deleteProduction(
                  production.id
                )
              }
              onRenamed={(title) =>
                renameProduction(
                  production.id,
                  title
                )
              }
              onDuplicated={() =>
                duplicateProduction(
                  production.id
                )
              }
            />

          ))}

        </div>

      )}

    </section>
  );
}