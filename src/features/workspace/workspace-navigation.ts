import type { WorkspaceNavigationItem } from "@/components/workspace";

export function getProductionWorkspaceNavigation(
  productionId: string
): WorkspaceNavigationItem[] {
  return [
    {
      id: "overview",
      label: "Overview",
      description: "Production overview",
    },

    {
      id: "story-bible",
      label: "Story Bible",
      description: "Story foundation",
    },

    {
      id: "characters",
      label: "Characters",
      description: "Character Bible",
    },

    {
      id: "locations",
      label: "Locations",
      description: "Location Bible",
    },

    {
      id: "scenes",
      label: "Scenes",
      description: "Scene Planner",
    },

    {
      id: "screenplay",
      label: "Screenplay",
      description: "Screenplay Editor",
    },

    {
      id: "storyboard",
      label: "Storyboard",
      description: "Storyboard Builder",
    },

    {
      id: "shot-list",
      label: "Shot List",
      description: "Production Shots",
    },

    {
      id: "ai-director",
      label: "AI Director",
      description: "Production Assistant",
    },

    {
      id: "render",
      label: "Render",
      description: "Export Production",
    },
  ];
}