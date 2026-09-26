"use client";

import { useState } from "react";

import { planAssetsFromProduction } from "../services/asset-planner";
import { planJobsFromAssets } from "../services/generation-job-engine";

interface AssetsViewProps {
  productionId: string;
}

export function AssetsView({ productionId }: AssetsViewProps) {
  const [notification, setNotification] = useState<string | null>(null);

  function handlePlan() {
    const planned = planAssetsFromProduction({});
    setNotification(
      planned.length === 0
        ? "No character, location, shot or panel records were supplied to plan from."
        : `Planned ${planned.length} assets for production ${productionId}.`,
    );
  }

  function handleQueue() {
    const jobs = planJobsFromAssets([]);
    setNotification(
      jobs.length === 0
        ? "No assets are eligible. A job needs a generation prompt and no file URL."
        : `Queued ${jobs.length} generation jobs.`,
    );
  }

  return (
    <div className="space-y-7 p-6 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Production · Assets</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Assets & Generation Jobs</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Collect reusable production assets from characters, locations, shots and storyboard panels. Queue observable generation jobs without inventing media.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handlePlan} className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-400">
            Plan from Production
          </button>
          <button type="button" onClick={handleQueue} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200">
            Queue Missing Jobs
          </button>
        </div>
      </div>
      {notification && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">{notification}</div>
      )}
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
        <h3 className="text-xl font-bold text-white">No Assets Match This View</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
          Persistence and job state attach through the assets and generation_jobs tables. Planning never invents a file URL.
        </p>
      </div>
    </div>
  );
}
