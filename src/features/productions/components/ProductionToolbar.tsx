"use client";

import type { ProductionSort } from "../hooks/use-productions";

interface ProductionToolbarProps {
  total: number;
  search: string;
  sort: ProductionSort;
  onSearch: (value: string) => void;
  onSort: (value: ProductionSort) => void;
}

export default function ProductionToolbar({
  total,
  search,
  sort,
  onSearch,
  onSort,
}: ProductionToolbarProps) {
  return (
    <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

      <div>

        <h2 className="text-3xl font-bold">
          Your Productions
        </h2>

        <p className="mt-2 text-zinc-400">
          {total} Production{total === 1 ? "" : "s"}
        </p>

      </div>

      <div className="flex flex-col gap-3 md:flex-row">

        <input
          type="search"
          value={search}
          onChange={(e) =>
            onSearch(e.target.value)
          }
          placeholder="Search productions..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none transition focus:border-yellow-500 md:w-80"
        />

        <select
          value={sort}
          onChange={(e) =>
            onSort(
              e.target.value as ProductionSort
            )
          }
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none transition focus:border-yellow-500"
        >
          <option value="updated">
            Recently Updated
          </option>

          <option value="created">
            Recently Created
          </option>

          <option value="name">
            Name
          </option>

        </select>

      </div>

    </section>
  );
}