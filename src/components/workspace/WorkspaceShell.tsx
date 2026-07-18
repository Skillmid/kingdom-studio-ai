"use client";

import { ReactNode } from "react";

import WorkspaceLayout from "./WorkspaceLayout";
import WorkspaceHeader from "./WorkspaceHeader";
import WorkspaceSidebar, {
  WorkspaceNavigationItem,
} from "./WorkspaceSidebar";

import {
  WorkspaceProvider,
} from "@/features/workspace";

import type {
  WorkspaceOptions,
} from "@/features/workspace";

interface WorkspaceShellProps {
  title: string;

  subtitle?: string;

  options: WorkspaceOptions;

  navigation: WorkspaceNavigationItem[];

  children: ReactNode;

  actions?: ReactNode;

  rightPanel?: ReactNode;
}

export default function WorkspaceShell({
  title,
  subtitle,
  options,
  navigation,
  children,
  actions,
  rightPanel,
}: WorkspaceShellProps) {
  return (
    <WorkspaceProvider options={options}>
      <WorkspaceLayout
        sidebar={
          <WorkspaceSidebar
            items={navigation}
          />
        }
        header={
          <WorkspaceHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
          />
        }
        rightPanel={rightPanel}
      >
        {children}
      </WorkspaceLayout>
    </WorkspaceProvider>
  );
}