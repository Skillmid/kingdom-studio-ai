import type {
  WorkspaceNavigationItem,
} from "@/components/workspace";

export function getProductionWorkspaceNavigation(
  productionId: string
): WorkspaceNavigationItem[] {
  const basePath =
    `/studio/productions/${productionId}`;

  return [
    {
      id: "overview",
      label: "Overview",
      description:
        "Production overview",
      href: basePath,
    },

    {
      id: "story-bible",
      label: "Story Bible",
      description:
        "Story foundation",
      href:
        `${basePath}/story-bible`,
    },

    {
      id: "characters",
      label: "Characters",
      description:
        "Character Bible",
      href:
        `${basePath}/characters`,
    },

    {
      id: "locations",
      label: "Locations",
      description:
        "Location Bible",
      href:
        `${basePath}/locations`,
    },

    {
      id: "scenes",
      label: "Scenes",
      description:
        "Scene Planner",
      href:
        `${basePath}/scenes`,
    },

    {
      id: "screenplay",
      label: "Screenplay",
      description:
        "Screenplay Editor",
      href:
        `${basePath}/screenplay`,
    },

    {
      id: "storyboard",
      label: "Storyboard",
      description:
        "Storyboard Builder",
      href:
        `${basePath}/storyboard`,
    },

    {
      id: "shot-list",
      label: "Shot List",
      description:
        "Production Shots",
      href:
        `${basePath}/shot-list`,
    },

    {
      id: "ai-director",
      label: "AI Director",
      description:
        "Production Assistant",
      href:
        `${basePath}/ai-director`,
    },

    {
      id: "render",
      label: "Render",
      description:
        "Export Production",
      href:
        `${basePath}/render`,
    },
  ];
}