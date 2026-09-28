"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  scriptPipeline,
} from "../services/script-pipeline.service";

import {
  scriptIntelligence,
} from "../services/script-intelligence.service";

import {
  screenplayRepository,
} from "../repositories/screenplay.repository";
import { screenplayAnalysisRepository } from "../repositories/screenplay-analysis.repository";
import { screenplayReviewRepository } from "../repositories/screenplay-review.repository";
import type { FocusedReviewType, ScreenplayReviewRecord } from "../repositories/screenplay-review.mapper";
import { findPersistedAnalysisRevision } from "../services/saved-analysis";

import type {
  ImportFileType,
} from "@/features/import-engine";

import type {
  ProductionKnowledge,
  ScreenplaySource,
} from "@/features/production-knowledge";

import type {
  ScriptAnalysis,
} from "../types/script-analysis";

import type {
  Screenplay,
  ScreenplayRevision,
} from "../types/screenplay";

interface ImportScriptInput {
  name: string;
  type: ImportFileType;
  content: string;
}

function getTitleFromFileName(fileName: string) {
  return (
    fileName.replace(/\.[^/.]+$/, "") || "Untitled Screenplay"
  );
}

export function useScriptWorkspace(productionId: string) {
  const [screenplay, setScreenplay] = useState<Screenplay | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Untitled Screenplay");
  const [fileName, setFileName] = useState<string | null>(null);
  const [source, setSource] = useState<ScreenplaySource>("internal");
  const [originalContent, setOriginalContent] = useState("");
  const [originalTitle, setOriginalTitle] = useState("Untitled Screenplay");
  const [knowledge, setKnowledge] = useState<ProductionKnowledge | null>(null);
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [analysisRevisionVersion, setAnalysisRevisionVersion] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ScreenplayReviewRecord[]>([]);
  const [revisions, setRevisions] = useState<ScreenplayRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    content !== originalContent ||
    title !== originalTitle;

  const loadRevisions = useCallback(
    async (screenplayId: string) => {
      const result = await screenplayRepository.getRevisions(screenplayId);
      setRevisions(result);
      return result;
    },
    []
  );

  const applyScreenplay = useCallback(
    async (existing: Screenplay | null) => {
      if (!existing) {
        setScreenplay(null);
        setContent("");
        setOriginalContent("");
        setTitle("Untitled Screenplay");
        setOriginalTitle("Untitled Screenplay");
        setFileName(null);
        setSource("internal");
        setKnowledge(null);
        setAnalysis(null);
        setAnalysisRevisionVersion(null);
        setReviews([]);
        setRevisions([]);
        return;
      }

      setScreenplay(existing);
      setContent(existing.content);
      setOriginalContent(existing.content);
      setTitle(existing.title);
      setOriginalTitle(existing.title);
      setFileName(existing.sourceFileName);
      setSource(existing.source);
      setKnowledge(null);
      setAnalysis(null);
      setAnalysisRevisionVersion(null);
      setReviews([]);

      const loadedRevisions = await loadRevisions(existing.id);
      const currentRevision = loadedRevisions.find((revision) => revision.version === existing.version);
      if (currentRevision) {
        const [savedAnalysis, savedReviews] = await Promise.all([
          screenplayAnalysisRepository.getLatestByRevisionId(currentRevision.id),
          screenplayReviewRepository.getByRevisionId(currentRevision.id),
        ]);
        setAnalysis(savedAnalysis?.analysis ?? null);
        setAnalysisRevisionVersion(savedAnalysis?.screenplayVersion ?? null);
        setReviews(savedReviews);
      }
    },
    [loadRevisions]
  );

  const load = useCallback(async () => {
    if (!productionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const existing = await screenplayRepository.getByProductionId(productionId);
      await applyScreenplay(existing);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load screenplay."
      );
    } finally {
      setLoading(false);
    }
  }, [productionId, applyScreenplay]);

  useEffect(() => {
    let cancelled = false;

    if (!productionId) {
      return () => {
        cancelled = true;
      };
    }

    screenplayRepository
      .getByProductionId(productionId)
      .then(async (existing) => {
        if (cancelled) return;
        await applyScreenplay(existing);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Unable to load screenplay."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productionId, applyScreenplay]);

  const importScript = useCallback(
    async (input: ImportScriptInput) => {
      setProcessing(true);
      setError(null);

      try {
        const result = await scriptPipeline.process(productionId, {
          name: input.name,
          type: input.type,
          content: input.content,
        });

        const importedTitle =
          result.knowledge.screenplay.title ||
          getTitleFromFileName(input.name);

        setContent(result.screenplay);
        setTitle(importedTitle);
        setFileName(input.name);
        setSource(input.type);
        setKnowledge(result.knowledge);
        setAnalysis(null);
        setAnalysisRevisionVersion(null);
        setReviews([]);

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to process screenplay.";
        setError(message);
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [productionId]
  );

  const analyseScreenplay = useCallback(async () => {
    if (!content.trim()) {
      return;
    }

    if (!screenplay || isDirty) {
      const message = "Save the current screenplay as a revision before running Script Intelligence.";
      setError(message);
      throw new Error(message);
    }

    const revision = findPersistedAnalysisRevision(screenplay, revisions, isDirty);
    if (!revision) {
      const message = "The current saved screenplay revision could not be found.";
      setError(message);
      throw new Error(message);
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await scriptIntelligence.analyze(content);
      const saved = await screenplayAnalysisRepository.create({
        productionId,
        screenplayId: screenplay.id,
        revisionId: revision.id,
        screenplayVersion: screenplay.version,
        analysis: result,
      });
      setAnalysis(saved.analysis);
      setAnalysisRevisionVersion(saved.screenplayVersion);
      return saved.analysis;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to analyse screenplay.";
      setError(message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [content, isDirty, productionId, revisions, screenplay]);

  const reviewScreenplay = useCallback(
    async (
      type: FocusedReviewType,
    ) => {
      if (!content.trim()) {
        return;
      }

      if (!screenplay) {
        const message = "Save the current screenplay as a revision before running a focused review.";
        setError(message);
        throw new Error(message);
      }

      const revision = findPersistedAnalysisRevision(screenplay, revisions, isDirty);
      if (!revision) {
        const message = "Save the current screenplay as a revision before running a focused review.";
        setError(message);
        throw new Error(message);
      }

      setProcessing(true);
      setError(null);

      try {
        const result = await scriptIntelligence.review(content, type);
        const saved = await screenplayReviewRepository.create({
          productionId,
          screenplayId: screenplay.id,
          revisionId: revision.id,
          screenplayVersion: screenplay.version,
          reviewType: type,
          review: result,
        });
        setReviews((current) => [saved, ...current]);
        return saved.review;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to review screenplay.";
        setError(message);
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [content, isDirty, productionId, revisions, screenplay]
  );

  const saveScreenplay = useCallback(
    async (reason = "manual-save") => {
      if (!productionId) {
        const message = "Production ID is required.";
        setError(message);
        throw new Error(message);
      }

      if (!content.trim()) {
        const message = "Screenplay content cannot be empty.";
        setError(message);
        throw new Error(message);
      }

      setSaving(true);
      setError(null);

      try {
        const saved = await screenplayRepository.save(productionId, {
          title: title.trim() || "Untitled Screenplay",
          content,
          source,
          sourceFileName: fileName,
          status: screenplay
            ? "revised"
            : fileName
              ? "imported"
              : "draft",
          reason,
        });

        setScreenplay(saved);
        setAnalysis(null);
        setAnalysisRevisionVersion(null);
        setReviews([]);
        setTitle(saved.title);
        setOriginalTitle(saved.title);
        setContent(saved.content);
        setOriginalContent(saved.content);
        setSource(saved.source);
        setFileName(saved.sourceFileName);

        await loadRevisions(saved.id);

        return saved;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to save screenplay.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [
      productionId,
      content,
      title,
      source,
      fileName,
      screenplay,
      loadRevisions,
    ]
  );

  const restoreRevision = useCallback(
    async (revisionId: string) => {
      if (!productionId) {
        const message = "Production ID is required.";
        setError(message);
        throw new Error(message);
      }

      setSaving(true);
      setError(null);

      try {
        const restored = await screenplayRepository.restoreRevision(
          productionId,
          revisionId
        );

        setScreenplay(restored);
        setAnalysis(null);
        setAnalysisRevisionVersion(null);
        setReviews([]);
        setTitle(restored.title);
        setOriginalTitle(restored.title);
        setContent(restored.content);
        setOriginalContent(restored.content);
        setSource(restored.source);
        setFileName(restored.sourceFileName);

        await loadRevisions(restored.id);

        return restored;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to restore revision.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [productionId, loadRevisions]
  );

  function clear() {
    setScreenplay(null);
    setContent("");
    setOriginalContent("");
    setTitle("Untitled Screenplay");
    setOriginalTitle("Untitled Screenplay");
    setFileName(null);
    setSource("internal");
    setKnowledge(null);
    setAnalysis(null);
    setAnalysisRevisionVersion(null);
    setReviews([]);
    setRevisions([]);
    setError(null);
  }

  return {
    screenplay,
    content,
    setContent,
    title,
    setTitle,
    fileName,
    source,
    knowledge,
    analysis,
    analysisRevisionVersion,
    reviews,
    revisions,
    loading,
    processing,
    saving,
    error,
    isDirty,
    importScript,
    analyseScreenplay,
    reviewScreenplay,
    saveScreenplay,
    restoreRevision,
    refresh: load,
    clear,
  };
}
