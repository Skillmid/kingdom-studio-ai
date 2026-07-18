"use client";

import {
  createContext,
  ReactNode,
  useContext,
} from "react";

import {
  useWorkspace,
} from "../hooks/use-workspace";

import type {
  WorkspaceOptions,
} from "../types/workspace";

type WorkspaceContextValue =
  ReturnType<typeof useWorkspace>;

const WorkspaceContext =
  createContext<WorkspaceContextValue | null>(
    null
  );

interface WorkspaceProviderProps {
  children: ReactNode;

  options: WorkspaceOptions;
}

export function WorkspaceProvider({
  children,
  options,
}: WorkspaceProviderProps) {
  const workspace =
    useWorkspace(options);

  return (
    <WorkspaceContext.Provider
      value={workspace}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context =
    useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      "useWorkspaceContext must be used inside WorkspaceProvider."
    );
  }

  return context;
}