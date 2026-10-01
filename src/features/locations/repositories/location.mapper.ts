import type {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from "../types/location";

export interface LocationRow {
  id: string;
  production_id: string;
  name: string;
  description: string | null;
  setting: Location["setting"];
  time_period: string | null;
  weather: string | null;
  architecture: string | null;
  lighting: string | null;
  mood: string | null;
  notes: string | null;
  status: Location["status"];
  progress: number | null;
  created_at: string;
  updated_at: string;
}

export function fromLocationDatabase(row: LocationRow): Location {
  return {
    id: row.id,
    productionId: row.production_id,
    name: row.name,
    description: row.description ?? undefined,
    setting: row.setting,
    timePeriod: row.time_period ?? undefined,
    weather: row.weather ?? undefined,
    architecture: row.architecture ?? undefined,
    lighting: row.lighting ?? undefined,
    mood: row.mood ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    progress: row.progress ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toLocationInsert(input: CreateLocationInput) {
  return {
    production_id: input.productionId,
    name: input.name,
    description: input.description,
    setting: input.setting ?? "interior",
    ...(input.timePeriod !== undefined ? { time_period: input.timePeriod } : {}),
    ...(input.weather !== undefined ? { weather: input.weather } : {}),
    ...(input.architecture !== undefined ? { architecture: input.architecture } : {}),
    ...(input.lighting !== undefined ? { lighting: input.lighting } : {}),
    ...(input.mood !== undefined ? { mood: input.mood } : {}),
    notes: input.notes,
    status: input.status ?? "draft",
    progress: input.progress ?? 0,
  };
}

export function toLocationUpdate(input: UpdateLocationInput) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.setting !== undefined ? { setting: input.setting } : {}),
    ...(input.timePeriod !== undefined ? { time_period: input.timePeriod } : {}),
    ...(input.weather !== undefined ? { weather: input.weather } : {}),
    ...(input.architecture !== undefined ? { architecture: input.architecture } : {}),
    ...(input.lighting !== undefined ? { lighting: input.lighting } : {}),
    ...(input.mood !== undefined ? { mood: input.mood } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.progress !== undefined ? { progress: input.progress } : {}),
  };
}