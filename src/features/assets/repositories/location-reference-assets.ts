import type { Asset } from "../types/asset";

export function filterLocationReferenceAssets(
  assets: Asset[],
  productionId: string,
  locationId: string,
): Asset[] {
  return assets.filter((asset) =>
    asset.productionId === productionId
      && asset.locationId === locationId
      && asset.kind === "location-reference",
  );
}

export type LocationReferenceLibraryState =
  | { kind: "empty" }
  | { kind: "assets"; assets: Asset[] };

export function getLocationReferenceLibraryState(
  assets: Asset[],
): LocationReferenceLibraryState {
  return assets.length === 0 ? { kind: "empty" } : { kind: "assets", assets };
}