import { supabase } from "@/lib/supabase/client";

import type { Location } from "../types/location";

const TABLE_NAME = "locations";

type LocationRow = {
  id: string;
  production_id: string;
  name: string;
  description: string | null;
  setting: Location["setting"];
  notes: string | null;
  status: Location["status"];
  progress: number | null;
  created_at: string;
  updated_at: string;
};

export class LocationRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<Location[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) =>
      this.mapLocation(row as LocationRow)
    );
  }

  async getById(id: string): Promise<Location | null> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return this.mapLocation(data as LocationRow);
  }

  async create(location: Partial<Location>): Promise<Location> {
    const payload = this.toDatabase(location);

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapLocation(data as LocationRow);
  }

  async createMany(locations: Partial<Location>[]): Promise<Location[]> {
    if (locations.length === 0) {
      return [];
    }

    const payloads = locations.map((location) =>
      this.toDatabase(location)
    );

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(payloads)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as LocationRow[]).map((row) =>
      this.mapLocation(row)
    );
  }

  async update(
    id: string,
    updates: Partial<Location>
  ): Promise<Location> {
    const payload = this.toDatabase(updates);

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapLocation(data as LocationRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private mapLocation(data: LocationRow): Location {
    return {
      id: data.id,
      productionId: data.production_id,
      name: data.name,
      description: data.description ?? undefined,
      setting: data.setting,
      notes: data.notes ?? undefined,
      status: data.status,
      progress: data.progress ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private toDatabase(location: Partial<Location>) {
    return {
      production_id: location.productionId,
      name: location.name,
      description: location.description,
      setting: location.setting ?? "interior",
      notes: location.notes,
      status: location.status ?? "draft",
      progress: location.progress ?? 0,
    };
  }
}

export const locationRepository = new LocationRepository();
