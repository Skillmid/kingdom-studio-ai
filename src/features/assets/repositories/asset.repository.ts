import { supabase } from "@/lib/supabase/client";
import type { Asset } from "../types/asset";
import { fromAssetRow, toAssetDatabase, type AssetRow } from "./asset.mapper";
import { filterLocationReferenceAssets } from "./location-reference-assets";
import { filterCharacterReferenceAssets } from "@/features/characters/repositories/character-reference-assets";

const TABLE_NAME = "assets";


export class AssetRepository {
  private readonly supabase = supabase;
  async getByProductionId(productionId: string): Promise<Asset[]> {
    const { data, error } = await this.supabase.from(TABLE_NAME).select("*").eq("production_id", productionId).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapAsset(row as AssetRow));
  }
  async getLocationReferences(productionId: string, locationId: string): Promise<Asset[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .eq("location_id", locationId)
      .eq("kind", "location-reference")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return filterLocationReferenceAssets(
      (data ?? []).map((row) => this.mapAsset(row as AssetRow)),
      productionId,
      locationId,
    );
  }
  async getCharacterReferences(productionId: string, characterId: string): Promise<Asset[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .eq("character_id", characterId)
      .eq("kind", "character-reference")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return filterCharacterReferenceAssets(
      (data ?? []).map((row) => this.mapAsset(row as AssetRow)),
      productionId,
      characterId,
    );
  }
  async create(asset: Partial<Asset>): Promise<Asset> {
    const { data, error } = await this.supabase.from(TABLE_NAME).insert(toAssetDatabase(asset, { includeDefaults: true })).select().single();
    if (error) throw new Error(error.message);
    return this.mapAsset(data as AssetRow);
  }
  async createMany(assets: Partial<Asset>[]): Promise<Asset[]> {
    if (assets.length === 0) return [];
    const { data, error } = await this.supabase.from(TABLE_NAME).insert(assets.map((asset) => toAssetDatabase(asset, { includeDefaults: true }))).select();
    if (error) throw new Error(error.message);
    return ((data ?? []) as AssetRow[]).map((row) => this.mapAsset(row));
  }
  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await this.supabase.from(TABLE_NAME).update(toAssetDatabase(updates)).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapAsset(data as AssetRow);
  }
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  private mapAsset(data: AssetRow): Asset {
    return fromAssetRow(data);
  }
}

export const assetRepository = new AssetRepository();
