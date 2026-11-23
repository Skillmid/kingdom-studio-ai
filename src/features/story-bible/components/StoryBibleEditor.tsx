"use client";

import { useState } from "react";
import { useSave } from "@/platform/save";
import { useStoryBible } from "../hooks/use-story-bible";
import type { StoryBibleScreenplayProposal } from "../services/story-bible-screenplay-sync.service";
import StoryBibleProgress from "./StoryBibleProgress";
import StoryBibleOverview from "./StoryBibleOverview";
import StoryBibleCreatorFoundation from "./StoryBibleCreatorFoundation";
import StoryBibleKingdomVision from "./StoryBibleKingdomVision";
import StoryBibleNarrative from "./StoryBibleNarrative";
import StoryBibleProductionDetails from "./StoryBibleProductionDetails";
import StoryBibleAIContext from "./StoryBibleAIContext";
import StoryBibleScreenplaySyncPanel from "./StoryBibleScreenplaySyncPanel";

interface StoryBibleEditorProps { productionId: string; }

interface StoryBibleForm {
  title: string; logline: string; synopsis: string;
  burden: string; truth: string; human_problem: string;
  theme: string; core_message: string; scripture_foundation: string; kingdom_objective: string;
  genre: string; target_audience: string; tone: string; language: string; visual_style: string;
  aspect_ratio: string; duration_minutes: number; universe: string; time_period: string; primary_location: string;
  beginning: string; conflict: string; midpoint: string; climax: string; ending: string;
  ai_context: string; ai_rules: string; forbidden_elements: string; preferred_vocabulary: string; visual_consistency: string;
}

const defaultForm: StoryBibleForm = {
  title: "", logline: "", synopsis: "", burden: "", truth: "", human_problem: "",
  theme: "", core_message: "", scripture_foundation: "", kingdom_objective: "",
  genre: "", target_audience: "", tone: "", language: "English", visual_style: "",
  aspect_ratio: "16:9", duration_minutes: 10, universe: "", time_period: "", primary_location: "",
  beginning: "", conflict: "", midpoint: "", climax: "", ending: "",
  ai_context: "", ai_rules: "", forbidden_elements: "", preferred_vocabulary: "", visual_consistency: "",
};

export default function StoryBibleEditor({ productionId }: StoryBibleEditorProps) {
  const {
    storyBible,
    loading,
    saving,
    syncing,
    error,
    save,
    syncFromScreenplay,
  } = useStoryBible(productionId);

  const { runSave } = useSave();
  const [form, setForm] = useState<StoryBibleForm>(defaultForm);
  const [syncedStoryBible, setSyncedStoryBible] = useState(storyBible);
  const [syncProposal, setSyncProposal] = useState<StoryBibleScreenplayProposal | null>(null);
  const [syncSource, setSyncSource] = useState<{
    title: string;
    version: number;
  } | null>(null);

  if (storyBible !== syncedStoryBible) {
    setSyncedStoryBible(storyBible);
    if (storyBible) {
      setForm({
        title: storyBible.title ?? "", logline: storyBible.logline ?? "", synopsis: storyBible.synopsis ?? "",
        burden: storyBible.burden ?? "", truth: storyBible.truth ?? "", human_problem: storyBible.human_problem ?? "",
        theme: storyBible.theme ?? "", core_message: storyBible.core_message ?? "", scripture_foundation: storyBible.scripture_foundation ?? "",
        kingdom_objective: storyBible.kingdom_objective ?? "", genre: storyBible.genre ?? "", target_audience: storyBible.target_audience ?? "",
        tone: storyBible.tone ?? "", language: storyBible.language ?? "English", visual_style: storyBible.visual_style ?? "",
        aspect_ratio: storyBible.aspect_ratio ?? "16:9", duration_minutes: storyBible.duration_minutes ?? 10,
        universe: storyBible.universe ?? "", time_period: storyBible.time_period ?? "", primary_location: storyBible.primary_location ?? "",
        beginning: storyBible.beginning ?? "", conflict: storyBible.conflict ?? "", midpoint: storyBible.midpoint ?? "",
        climax: storyBible.climax ?? "", ending: storyBible.ending ?? "", ai_context: storyBible.ai_context ?? "",
        ai_rules: storyBible.ai_rules ?? "", forbidden_elements: storyBible.forbidden_elements ?? "",
        preferred_vocabulary: storyBible.preferred_vocabulary ?? "", visual_consistency: storyBible.visual_consistency ?? "",
      });
    }
  }

  function update<K extends keyof StoryBibleForm>(key: K, value: StoryBibleForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    try { await runSave(async () => { await save(form); }); } catch { /* state handled by hooks */ }
  }

  async function handleSync() {
    try {
      const result = await syncFromScreenplay();
      setSyncProposal(result.proposal);
      setSyncSource({
        title: result.screenplayTitle,
        version: result.screenplayVersion,
      });
    } catch {
      // Hook exposes the error.
    }
  }

  function applySyncProposal() {
    if (!syncProposal) {
      return;
    }

    setForm((current) => {
      const next = { ...current };

      for (const [key, value] of Object.entries(syncProposal)) {
        if (value === undefined || value === null) {
          continue;
        }

        if (key in next) {
          (next as Record<string, string | number>)[key] = value as string | number;
        }
      }

      return next;
    });

    setSyncProposal(null);
    setSyncSource(null);
  }

  function discardSyncProposal() {
    setSyncProposal(null);
    setSyncSource(null);
  }

  if (loading) return <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-20 text-center">Loading Story Bible...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">Screenplay-driven foundation</p>
          <p className="mt-2 text-sm text-zinc-400">
            Let AI propose Story Bible values from the screenplay. You remain the final creative authority.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || saving}
          className="shrink-0 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-5 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? "Analysing Screenplay..." : "Sync from Screenplay"}
        </button>
      </div>

      {syncProposal && syncSource && (
        <StoryBibleScreenplaySyncPanel
          proposal={syncProposal}
          screenplayTitle={syncSource.title}
          screenplayVersion={syncSource.version}
          onApply={applySyncProposal}
          onCancel={discardSyncProposal}
        />
      )}

      {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-400">{error}</div>}

      <StoryBibleProgress values={form} />

      <StoryBibleOverview
        title={form.title} logline={form.logline} synopsis={form.synopsis}
        onTitleChange={(value) => update("title", value)}
        onLoglineChange={(value) => update("logline", value)}
        onSynopsisChange={(value) => update("synopsis", value)}
      />

      <StoryBibleCreatorFoundation
        burden={form.burden} truth={form.truth} humanProblem={form.human_problem}
        onBurdenChange={(value) => update("burden", value)}
        onTruthChange={(value) => update("truth", value)}
        onHumanProblemChange={(value) => update("human_problem", value)}
      />

      <StoryBibleKingdomVision
        theme={form.theme} coreMessage={form.core_message} scriptureFoundation={form.scripture_foundation} kingdomObjective={form.kingdom_objective}
        onThemeChange={(value) => update("theme", value)}
        onCoreMessageChange={(value) => update("core_message", value)}
        onScriptureFoundationChange={(value) => update("scripture_foundation", value)}
        onKingdomObjectiveChange={(value) => update("kingdom_objective", value)}
      />

      <StoryBibleNarrative
        beginning={form.beginning} conflict={form.conflict} midpoint={form.midpoint} climax={form.climax} ending={form.ending}
        onBeginningChange={(value) => update("beginning", value)}
        onConflictChange={(value) => update("conflict", value)}
        onMidpointChange={(value) => update("midpoint", value)}
        onClimaxChange={(value) => update("climax", value)}
        onEndingChange={(value) => update("ending", value)}
      />

      <StoryBibleProductionDetails
        genre={form.genre} targetAudience={form.target_audience} tone={form.tone} language={form.language} visualStyle={form.visual_style}
        aspectRatio={form.aspect_ratio} durationMinutes={form.duration_minutes} universe={form.universe} timePeriod={form.time_period} primaryLocation={form.primary_location}
        onGenreChange={(value) => update("genre", value)} onTargetAudienceChange={(value) => update("target_audience", value)} onToneChange={(value) => update("tone", value)}
        onLanguageChange={(value) => update("language", value)} onVisualStyleChange={(value) => update("visual_style", value)} onAspectRatioChange={(value) => update("aspect_ratio", value)}
        onDurationMinutesChange={(value) => update("duration_minutes", value)} onUniverseChange={(value) => update("universe", value)} onTimePeriodChange={(value) => update("time_period", value)}
        onPrimaryLocationChange={(value) => update("primary_location", value)}
      />

      <StoryBibleAIContext
        aiContext={form.ai_context} aiRules={form.ai_rules} forbiddenElements={form.forbidden_elements} preferredVocabulary={form.preferred_vocabulary} visualConsistency={form.visual_consistency}
        onAIContextChange={(value) => update("ai_context", value)} onAIRulesChange={(value) => update("ai_rules", value)}
        onForbiddenElementsChange={(value) => update("forbidden_elements", value)} onPreferredVocabularyChange={(value) => update("preferred_vocabulary", value)}
        onVisualConsistencyChange={(value) => update("visual_consistency", value)}
      />

      <div className="sticky bottom-6 flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-2xl bg-yellow-500 px-10 py-4 font-semibold text-black shadow-xl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving Story Bible..." : "Save Story Bible"}
        </button>
      </div>
    </div>
  );
}
