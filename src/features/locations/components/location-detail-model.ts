import type { Location } from "../types/location";

export interface LocationDetailFields {
  setting: string;
  status: string;
  progress: number;
  description: string;
  notes: string;
  timePeriod: string;
  weather: string;
  architecture: string;
  lighting: string;
  mood: string;
}

export function getLocationDetailFields(
  location: Location
): LocationDetailFields {
  const setting = location.setting === "both"
    ? "Interior / Exterior"
    : location.setting[0].toUpperCase() + location.setting.slice(1);

  return {
    setting,
    status: location.status === "in-progress"
      ? "In Progress"
      : location.status[0].toUpperCase() + location.status.slice(1),
    progress: Math.max(0, Math.min(100, location.progress)),
    description: location.description?.trim() || "No location description yet.",
    notes: location.notes?.trim() || "No production notes yet.",
    timePeriod: location.timePeriod?.trim() || "Not defined yet.",
    weather: location.weather?.trim() || "Not defined yet.",
    architecture: location.architecture?.trim() || "Not defined yet.",
    lighting: location.lighting?.trim() || "Not defined yet.",
    mood: location.mood?.trim() || "Not defined yet.",
  };
}