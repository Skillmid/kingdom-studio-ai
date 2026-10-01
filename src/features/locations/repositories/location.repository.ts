import { supabase } from "@/lib/supabase/client";

import type {
  CreateLocationInput,
  Location,
  UpdateLocationInput,
} from "../types/location";
import {
  fromLocationDatabase,
  toLocationInsert,
  toLocationUpdate,
  type LocationRow,
} from "./location.mapper";

const TABLE_NAME = "locations";

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

    return (data ?? []).map((row) => fromLocationDatabase(row as LocationRow));
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

    return fromLocationDatabase(data as LocationRow);
  }

  async create(location: CreateLocationInput): Promise<Location> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(toLocationInsert(location))
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return fromLocationDatabase(data as LocationRow);
  }

  async createMany(locations: CreateLocationInput[]): Promise<Location[]> {
    if (locations.length === 0) {
      return [];
    }

    const payloads = locations.map(toLocationInsert);

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(payloads)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as LocationRow[]).map(fromLocationDatabase);
  }

  async update(
    id: string,
    updates: UpdateLocationInput
  ): Promise<Location> {
    const payload = toLocationUpdate(updates);

    if (Object.keys(payload).length === 0) {
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error("Location not found.");
      }
      return existing;
    }

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return fromLocationDatabase(data as LocationRow);
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

}

export const locationRepository = new LocationRepository();
