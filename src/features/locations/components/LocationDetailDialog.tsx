"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assetRepository } from "@/features/assets/repositories/asset.repository";
import type { Asset } from "@/features/assets/types/asset";
import { getLocationReferenceLibraryState } from "@/features/assets/repositories/location-reference-assets";
import { getLocationDetailFields } from "./location-detail-model";
import type { Location } from "../types/location";

interface LocationDetailDialogProps {
  productionId: string;
  location: Location | null;
  open: boolean;
  onClose: () => void;
  onEdit: (location: Location) => void;
}

export default function LocationDetailDialog({
  productionId,
  location,
  open,
  onClose,
  onEdit,
}: LocationDetailDialogProps) {
  if (!open || !location) return null;

  const details = getLocationDetailFields(location);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-detail-title"
        className="mx-auto my-10 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-8"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500">
              Location Bible
            </p>
            <h2 id="location-detail-title" className="mt-2 break-words text-2xl font-bold text-white">
              {location.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Location Bible"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Close
          </button>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <DetailField label="Setting" value={details.setting} />
          <DetailField label="Status" value={details.status} />
          <DetailField label="Development" value={`${details.progress}%`} />
        </div>

        <div className="mt-6 space-y-5">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Environment Profile
            </h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailField label="Time Period" value={details.timePeriod} />
              <DetailField label="Weather" value={details.weather} />
              <DetailField label="Architecture" value={details.architecture} />
              <DetailField label="Lighting" value={details.lighting} />
              <DetailField label="Mood" value={details.mood} />
            </dl>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Description
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
              {details.description}
            </p>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Production Notes
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
              {details.notes}
            </p>
          </section>
          <LocationReferenceLibrary
            productionId={productionId}
            locationId={location.id}
          />
        </div>

        <footer className="mt-8 flex justify-end gap-3 border-t border-zinc-800 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => onEdit(location)}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-400"
          >
            Edit Location
          </button>
        </footer>
      </section>
    </div>
  );
}

function LocationReferenceLibrary({
  productionId,
  locationId,
}: {
  productionId: string;
  locationId: string;
}) {
  const [result, setResult] = useState<{
    locationId: string;
    assets?: Asset[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    assetRepository
      .getLocationReferences(productionId, locationId)
      .then((assets) => {
        if (!cancelled) setResult({ locationId, assets });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({
            locationId,
            error: error instanceof Error ? error.message : "Unable to load location references.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [locationId, productionId]);

  const currentResult = result?.locationId === locationId ? result : null;
  const libraryState = currentResult?.assets
    ? getLocationReferenceLibraryState(currentResult.assets)
    : null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Reference Library
          </h3>
          <p className="mt-1 text-xs text-zinc-500">Location reference assets managed in the production Assets workspace.</p>
        </div>
        <Link
          href={`/studio/productions/${productionId}/assets`}
          className="shrink-0 rounded-lg border border-yellow-500/30 px-3 py-2 text-xs font-bold text-yellow-300 transition hover:border-yellow-400 hover:text-yellow-200"
        >
          Add Reference
        </Link>
      </header>
      {!currentResult ? (
        <p className="mt-3 text-sm text-zinc-400">Loading references...</p>
      ) : currentResult.error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">{currentResult.error}</p>
      ) : libraryState?.kind === "assets" ? (
        <ul className="mt-3 space-y-3">
          {libraryState.assets.map((asset) => (
            <li key={asset.id} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <p className="text-sm font-semibold text-white">{asset.title || "Location reference"}</p>
              {asset.description ? <p className="mt-1 text-sm text-zinc-400">{asset.description}</p> : null}
              {asset.fileUrl ? (
                <div className="mt-3 space-y-2">
                  <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-zinc-800 bg-black/40">
                    <Image
                      src={asset.fileUrl}
                      alt={`${asset.title || "Location reference"} image`}
                      width={1280}
                      height={720}
                      unoptimized
                      className="max-h-64 w-full object-contain"
                    />
                  </a>
                  <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="inline-block break-all text-xs text-yellow-300 underline underline-offset-2">
                    Open full-size reference
                  </a>
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">No media URL is available.</p>
              )}
              <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                {asset.status.replace(/-/g, " ")}{asset.userApproved ? " · approved" : " · awaiting approval"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">No reference images yet.</p>
      )}
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}