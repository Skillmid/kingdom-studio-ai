"use client";

import { useState } from "react";

import {
  calculateWorkspaceProgress,
} from "../utils/workspace-progress";

import type {
  WorkspaceOptions,
  WorkspaceSection,
} from "../types/workspace";

export function useWorkspace({
  sections,
  initialSection,
}: WorkspaceOptions) {
  const initial =
    initialSection ??
    sections[0]?.id ??
    "";

  const [activeSection, setActiveSection] =
    useState(initial);

  const [dirty, setDirty] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [lastSavedAt, setLastSavedAt] =
    useState<Date | null>(null);

  const progress =
    calculateWorkspaceProgress(
      sections
    );

  function goToSection(
    sectionId: string
  ) {
    setActiveSection(sectionId);
  }

  function markDirty() {
    setDirty(true);
  }

  function beginSave() {
    setSaving(true);
  }

  function finishSave() {
    setSaving(false);

    setDirty(false);

    setLastSavedAt(
      new Date()
    );
  }

  function getActiveSection():
    | WorkspaceSection
    | undefined {
    return sections.find(
      (section) =>
        section.id ===
        activeSection
    );
  }

  return {
    sections,

    activeSection,

    dirty,

    saving,

    progress,

    lastSavedAt,

    goToSection,

    markDirty,

    beginSave,

    finishSave,

    getActiveSection,
  };
}