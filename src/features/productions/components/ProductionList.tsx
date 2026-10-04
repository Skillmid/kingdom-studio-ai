"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import ProductionCard from "./ProductionCard";
import ProductionToolbar from "./ProductionToolbar";
import ArchivedProductionList from "./ArchivedProductionList";
import CreateProductionDialog from "./CreateProductionDialog";

import { useProductions } from "../hooks/use-productions";

export default function ProductionList() {
  const {
    productions,
    loading,
    search,
    setSearch,
    sort,
    setSort,
    archiveProduction,
    renameProduction,
    duplicateProduction,
  } = useProductions();

  const [tab, setTab] = useState<"active" | "archived">("active");
  const [createOpen, setCreateOpen] = useState(false);

  if (loading) {
    return (
      <section className="mt-10">
        <ProductionToolbar
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
    <>
      <section className="mt-10">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-xl px-5 py-2 transition ${
            tab === "active"
              ? "bg-yellow-500 font-semibold text-black"
              : "border border-zinc-700 text-white hover:border-yellow-500"
          }`}
        >
          Active
        </button>

        <button
          type="button"
          onClick={() => setTab("archived")}
          className={`rounded-xl px-5 py-2 transition ${
            tab === "archived"
              ? "bg-yellow-500 font-semibold text-black"
              : "border border-zinc-700 text-white hover:border-yellow-500"
          }`}
        >
          Archived
        </button>
      </div>

      {tab === "active" && (
        <>
          <ProductionToolbar
            total={productions.length}
            search={search}
            sort={sort}
            onSearch={setSearch}
            onSort={setSort}
          />

          {productions.length === 0 ? (
            search.trim() ? (
              <div className="mt-6 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-16 text-center">
                <h3 className="text-2xl font-bold">No matching productions</h3>
                <p className="mt-3 text-zinc-400">
                  No productions matched &ldquo;{search}&rdquo;. Try another title or clear your search.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-6 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold transition hover:border-yellow-500 hover:text-yellow-400"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-20 text-center">
                <h3 className="text-3xl font-bold">
                  No Productions
                </h3>

                <p className="mt-4 text-zinc-400">
                  Start building your first Kingdom film project.
                </p>

                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400"
                >
                  + New Production
                </button>
              </div>
            )
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {productions.map((production) => (
                <ProductionCard
                  key={production.id}
                  production={production}
                  onDeleted={async () => {
                    await archiveProduction(production.id);
                  }}
                  onRenamed={async (title) => {
                    await renameProduction(
                      production.id,
                      title
                    );
                  }}
                  onDuplicated={() =>
                    duplicateProduction(
                      production.id
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "archived" && (
        <ArchivedProductionList />
      )}
    </section>

    <Dialog
      open={createOpen}
      onOpenChange={setCreateOpen}
    >
      <DialogContent
        title="Create New Production"
        description="Create a new Kingdom film project."
      >
        <CreateProductionDialog
          onClose={() => setCreateOpen(false)}
        />
      </DialogContent>
    </Dialog>
  </>
  );
}
