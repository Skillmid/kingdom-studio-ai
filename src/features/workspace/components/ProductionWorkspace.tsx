"use client";

import { ReactNode } from "react";

import {
  WorkspaceShell,
} from "@/components/workspace";

import {
  getProductionWorkspaceNavigation,
} from "../workspace-navigation";

import type {
  WorkspaceOptions,
} from "../types/workspace";

interface ProductionWorkspaceProps {
  productionId: string;

  title: string;

  subtitle?: string;

  options: WorkspaceOptions;

  children: ReactNode;
}

export default function ProductionWorkspace({
  productionId,
  title,
  subtitle,
  options,
  children,
}: ProductionWorkspaceProps) {
  return (
    <WorkspaceShell
      title={title}
      subtitle={subtitle}
      options={options}
      navigation={getProductionWorkspaceNavigation(
        productionId
      )}
    >
      {children}
    </WorkspaceShell>
  );
}