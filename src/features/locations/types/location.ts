export type LocationSetting = "interior" | "exterior" | "both";

export type LocationStatus = "draft" | "in-progress" | "completed";

export interface CreateLocationInput {
  productionId: string;
  name: string;
  description?: string;
  setting?: LocationSetting;
  timePeriod?: string;
  weather?: string;
  architecture?: string;
  lighting?: string;
  mood?: string;
  notes?: string;
  status?: LocationStatus;
  progress?: number;
}

export type UpdateLocationInput = Partial<
  Omit<CreateLocationInput, "productionId">
>;

export interface Location {
  id: string;
  productionId: string;
  name: string;
  description?: string;
  setting: LocationSetting;
  timePeriod?: string;
  weather?: string;
  architecture?: string;
  lighting?: string;
  mood?: string;
  notes?: string;
  status: LocationStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
