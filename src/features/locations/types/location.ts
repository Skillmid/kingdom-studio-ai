export type LocationSetting = "interior" | "exterior" | "both";

export type LocationStatus = "draft" | "in-progress" | "completed";

export interface Location {
  id: string;
  productionId: string;
  name: string;
  description?: string;
  setting: LocationSetting;
  notes?: string;
  status: LocationStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
