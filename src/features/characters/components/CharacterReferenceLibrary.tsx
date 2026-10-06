"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Asset } from "@/features/assets/types/asset";
import type { Character } from "../types/character";
import { characterRepository } from "../repositories/character.repository";
import {
  buildCharacterReferenceProposal,
  getCharacterReferenceLibraryState,
} from "../repositories/character-reference-assets";

interface CharacterReferenceLibraryProps {
  productionId: string;
  character: Character;
  onReferencesChange?: () => void;
}

export default function CharacterReferenceLibrary({
  productionId,
  character,
  onReferencesChange,
}: CharacterReferenceLibraryProps) {
  const [references, setReferences] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newApproved, setNewApproved] = useState(true);

  const [selectedFullSizeAsset, setSelectedFullSizeAsset] = useState<Asset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (!productionId || !character.id) {
      return;
    }

    let cancelled = false;

    characterRepository
      .getCharacterReferences(productionId, character.id)
      .then((data) => {
        if (!cancelled) {
          setReferences(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load character visual references.",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [character.id, productionId, refreshKey]);

  async function handleApprove(asset: Asset) {
    try {
      setActionLoading(true);
      setError(null);
      await characterRepository.updateCharacterReference(asset.id, {
        userApproved: true,
      });
      setNotice(
        `Reference "${asset.title || "Character Reference"}" is now an approved visual reference.`,
      );
      setRefreshKey((k) => k + 1);
      onReferencesChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to approve reference.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeApproval(asset: Asset) {
    try {
      setActionLoading(true);
      setError(null);
      await characterRepository.updateCharacterReference(asset.id, {
        userApproved: false,
      });
      setNotice(`Approval revoked for "${asset.title || "Character Reference"}". Returned to draft review.`);
      setRefreshKey((k) => k + 1);
      onReferencesChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to revoke approval.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(asset: Asset) {
    try {
      setActionLoading(true);
      setError(null);
      await characterRepository.deleteCharacterReference(asset.id);
      setNotice(`Visual reference "${asset.title || "Character Reference"}" was removed.`);
      setDeletingAssetId(null);
      setRefreshKey((k) => k + 1);
      onReferencesChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove reference.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddSubmit(e?: React.SyntheticEvent) {
    if (e) {
      e.preventDefault();
    }

    if (!newFileUrl.trim()) {
      setError("Please provide an image or reference URL.");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const proposal = buildCharacterReferenceProposal({
        productionId,
        characterId: character.id,
        characterName: character.name,
        title: newTitle.trim() || `${character.name} Visual Reference`,
        fileUrl: newFileUrl.trim(),
        description: newDescription.trim() || undefined,
        userApproved: newApproved,
      });

      await characterRepository.createCharacterReference(proposal);

      setNewTitle("");
      setNewFileUrl("");
      setNewDescription("");
      setNewApproved(true);
      setShowAddForm(false);
      setNotice(`Added reference image for ${character.name}.`);

      setRefreshKey((k) => k + 1);
      onReferencesChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add reference image.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateProposal() {
    try {
      setActionLoading(true);
      setError(null);

      const continuityTraits = [
        character.appearance,
        character.distinguishingFeatures,
        character.hairColor ? `hair: ${character.hairColor}` : undefined,
        character.eyeColor ? `eyes: ${character.eyeColor}` : undefined,
        character.occupation ? `occupation: ${character.occupation}` : undefined,
      ].filter(Boolean).join("; ");

      const prompt = continuityTraits
        ? `Cinematic character reference still of ${character.name}. Physical traits: ${continuityTraits}. Photorealistic lighting, clear facial structure and costume silhouette.`
        : `Cinematic character reference still of ${character.name}. Authentic character portrait and wardrobe continuity.`;

      const proposal = buildCharacterReferenceProposal({
        productionId,
        characterId: character.id,
        characterName: character.name,
        title: `${character.name} Visual Reference Proposal`,
        description: continuityTraits || `Grounded reference derived from ${character.name}'s character profile.`,
        prompt,
        sourceEvidence: continuityTraits || `Character: ${character.name}`,
        userApproved: false,
      });

      await characterRepository.createCharacterReference(proposal);
      setNotice(`Created reference proposal for ${character.name}. Review prompt details or queue generation in Assets.`);

      setRefreshKey((k) => k + 1);
      onReferencesChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create reference proposal.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRegenerateProposal(baseAsset?: Asset) {
    try {
      setActionLoading(true);
      setError(null);

      const continuityTraits = [
        character.appearance,
        character.distinguishingFeatures,
        character.hairColor ? `hair: ${character.hairColor}` : undefined,
        character.eyeColor ? `eyes: ${character.eyeColor}` : undefined,
        character.occupation ? `occupation: ${character.occupation}` : undefined,
      ].filter(Boolean).join("; ");

      const prompt =
        baseAsset?.prompt ||
        (continuityTraits
          ? `Cinematic character reference still of ${character.name}. Physical traits: ${continuityTraits}. Photorealistic lighting, clear facial structure and costume silhouette.`
          : `Cinematic character reference still of ${character.name}. Authentic character portrait and wardrobe continuity.`);

      const proposal = buildCharacterReferenceProposal({
        productionId,
        characterId: character.id,
        characterName: character.name,
        title: baseAsset
          ? `Alternative: ${baseAsset.title || character.name + " Look"}`
          : `${character.name} Visual Reference Proposal`,
        description:
          baseAsset?.description ||
          continuityTraits ||
          `Grounded reference derived from ${character.name}'s character profile.`,
        prompt,
        sourceEvidence:
          baseAsset?.sourceEvidence || continuityTraits || `Character: ${character.name}`,
        userApproved: false,
      });

      await characterRepository.createCharacterReference(proposal);
      setNotice(
        `Created alternative reference proposal without overwriting "${baseAsset?.title || "existing reference"}". Review and approve when ready.`
      );

      setRefreshKey((k) => k + 1);
      onReferencesChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate reference proposal.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const libraryState = getCharacterReferenceLibraryState(references);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-8">
      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">
            Pre-Production • Visual Continuity
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            Visual References & Identity
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Establish and review visual continuity for {character.name}. Approved
            references maintain consistent wardrobe, facial traits, and lighting
            across scenes, shots, and downstream media generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm((open) => !open)}
            disabled={actionLoading}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-bold text-zinc-200 transition hover:border-yellow-500 hover:text-white disabled:opacity-50"
          >
            {showAddForm ? "Cancel Add" : "+ Add Reference Image"}
          </button>

          <button
            type="button"
            onClick={handleCreateProposal}
            disabled={actionLoading}
            className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 text-xs font-bold text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-50"
          >
            Create Reference Proposal
          </button>

          <Link
            href={`/studio/productions/${productionId}/assets`}
            className="rounded-xl bg-yellow-500 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-400"
          >
            Queue in Assets &rarr;
          </Link>
        </div>
      </header>

      {/* Continuity Standard Banner */}
      <div className="mt-5 rounded-2xl border border-yellow-500/25 bg-yellow-500/5 p-4 text-xs leading-5 text-zinc-300">
        <span className="font-bold text-yellow-400">Creator Authority: </span>
        Every AI-generated visual remains a proposal until explicitly approved.
        Use approved references to guide camera and character continuity throughout the production.
      </div>

      {notice && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-zinc-400 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-zinc-400 transition hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Reference Image Sub-Panel */}
      {showAddForm && (
        <div className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-bold text-white">Add Character Reference Image</h4>
            <span className="text-xs text-zinc-500">Links to Production Assets</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ref-title" className="mb-1 block text-xs font-semibold text-zinc-300">
                Reference Title
              </label>
              <input
                id="ref-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Front Portrait, Costume & Wardrobe"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
              />
            </div>

            <div>
              <label htmlFor="ref-url" className="mb-1 block text-xs font-semibold text-zinc-300">
                Image / File URL *
              </label>
              <input
                id="ref-url"
                type="url"
                required
                value={newFileUrl}
                onChange={(e) => setNewFileUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubmit();
                  }
                }}
                placeholder="https://example.com/character-look.png"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ref-desc" className="mb-1 block text-xs font-semibold text-zinc-300">
              Visual Description & Continuity Notes
            </label>
            <textarea
              id="ref-desc"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Notes on wardrobe, facial features, or key visual anchors..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-yellow-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={newApproved}
                onChange={(e) => setNewApproved(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-yellow-500 focus:ring-yellow-500"
              />
              <span>Set as Approved Character Reference</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !newFileUrl.trim()}
                onClick={() => handleAddSubmit()}
                className="rounded-xl bg-yellow-500 px-5 py-2 text-xs font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Reference"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main References Content */}
      <div className="mt-6">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            Loading visual references...
          </div>
        ) : libraryState.kind === "empty" ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-xl text-yellow-500">
              ✦
            </div>
            <h4 className="mt-4 text-base font-bold text-white">
              No Visual References Established
            </h4>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-400">
              Establish this character&apos;s appearance for consistent filmmaking.
              Add an existing image URL or create a grounded prompt proposal derived
              from this character&apos;s physical profile.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:border-yellow-500 hover:text-white"
              >
                + Add Reference Image
              </button>
              <button
                type="button"
                onClick={handleCreateProposal}
                className="rounded-xl bg-yellow-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-yellow-400"
              >
                Create Proposal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status summary counters */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span className="font-semibold text-white">
                {libraryState.assets.length} Total Visual Reference{libraryState.assets.length === 1 ? "" : "s"}
              </span>
              <span>•</span>
              <span className="text-yellow-400">
                {libraryState.approvedCount} Approved
              </span>
              {libraryState.pendingCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-zinc-400">
                    {libraryState.pendingCount} Awaiting Review
                  </span>
                </>
              )}
            </div>

            {/* References Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {libraryState.assets.map((asset) => {
                const hasImage = Boolean(asset.fileUrl && asset.fileUrl.trim());
                const isApproved = asset.userApproved;
                const isConfirmingDelete = deletingAssetId === asset.id;

                return (
                  <article
                    key={asset.id}
                    className={`group flex flex-col justify-between overflow-hidden rounded-2xl border transition ${
                      isApproved
                        ? "border-yellow-500/40 bg-zinc-950/80 shadow-[0_0_20px_rgba(234,179,8,0.06)]"
                        : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      {/* Image Thumbnail Container */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-zinc-800/80 bg-zinc-900">
                        {hasImage ? (
                          <>
                            <Image
                              src={asset.fileUrl!}
                              alt={asset.title || "Character visual reference"}
                              fill
                              unoptimized
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedFullSizeAsset(asset)}
                              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100"
                              aria-label="View full size image"
                            >
                              <span className="rounded-lg border border-white/30 bg-black/70 px-3 py-1.5 text-xs font-bold text-white">
                                View Full Size
                              </span>
                            </button>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                            <span className="text-2xl text-zinc-600">✦</span>
                            <span className="mt-2 text-xs font-semibold text-zinc-400">
                              Awaiting Generation
                            </span>
                            <span className="mt-1 text-[11px] text-zinc-600">
                              Prompt established in production records
                            </span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                          {isApproved ? (
                            <span className="rounded-lg border border-yellow-500/40 bg-black/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-400 backdrop-blur">
                              Approved Character Reference
                            </span>
                          ) : (
                            <span className="rounded-lg border border-zinc-700 bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 backdrop-blur">
                              Review Required
                            </span>
                          )}
                        </div>

                        <div className="absolute right-3 top-3">
                          <span className="rounded-lg border border-zinc-800 bg-black/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 backdrop-blur">
                            {asset.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Meta Content */}
                      <div className="p-4 space-y-2.5">
                        <h4 className="text-sm font-bold text-white">
                          {asset.title || "Character Reference"}
                        </h4>

                        {asset.description && (
                          <p className="line-clamp-2 text-xs leading-5 text-zinc-400">
                            {asset.description}
                          </p>
                        )}

                        {isApproved && (
                          <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-2.5 text-[11px] leading-4 text-yellow-300">
                            Use this reference to maintain visual continuity across generated scenes and shots.
                          </div>
                        )}

                        {asset.prompt && (
                          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Grounded Prompt
                            </p>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-300">
                              {asset.prompt}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-1">
                          <span className="uppercase">{asset.provenance}</span>
                          <span>•</span>
                          <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="border-t border-zinc-800/80 p-3 bg-zinc-900/30">
                      {isConfirmingDelete ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-red-400">Confirm removal?</span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDeletingAssetId(null)}
                              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(asset)}
                              disabled={actionLoading}
                              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleRevokeApproval(asset)}
                              disabled={actionLoading}
                              className="text-xs font-semibold text-zinc-400 hover:text-yellow-400"
                            >
                              Revoke Approval
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApprove(asset)}
                              disabled={actionLoading}
                              className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-400"
                            >
                              Approve Reference
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRegenerateProposal(asset)}
                              disabled={actionLoading}
                              className="text-xs text-zinc-400 hover:text-white"
                              title="Create an alternative proposal without overwriting this reference"
                            >
                              New Alternative
                            </button>

                            {hasImage && (
                              <button
                                type="button"
                                onClick={() => setSelectedFullSizeAsset(asset)}
                                className="text-xs text-zinc-400 hover:text-white"
                              >
                                View
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeletingAssetId(asset.id)}
                              className="text-xs text-zinc-500 hover:text-red-400"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full-Size Preview Modal */}
      {selectedFullSizeAsset && selectedFullSizeAsset.fileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-500">
                  {selectedFullSizeAsset.userApproved ? "Approved Character Reference" : "Draft Reference Proposal"}
                </p>
                <h4 className="mt-1 text-lg font-bold text-white">
                  {selectedFullSizeAsset.title || `${character.name} Visual Reference`}
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedFullSizeAsset.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedFullSizeAsset(null)}
                  className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="relative max-h-[65vh] w-full overflow-hidden rounded-2xl bg-black">
              <Image
                src={selectedFullSizeAsset.fileUrl}
                alt={selectedFullSizeAsset.title || "Full size reference"}
                width={1280}
                height={720}
                unoptimized
                className="max-h-[65vh] w-full object-contain"
              />
            </div>

            {selectedFullSizeAsset.description && (
              <p className="mt-4 text-xs text-zinc-400">
                {selectedFullSizeAsset.description}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
