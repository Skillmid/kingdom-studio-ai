export interface WorkspaceSection {
  id: string;

  title: string;

  description?: string;

  completed?: boolean;

  disabled?: boolean;
}

export interface WorkspaceState {
  activeSection: string;

  dirty: boolean;

  saving: boolean;

  progress: number;

  lastSavedAt: Date | null;
}

export interface WorkspaceOptions {
  sections: WorkspaceSection[];

  initialSection?: string;

  autoSave?: boolean;
}