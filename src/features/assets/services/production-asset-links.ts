export interface ProductionAssetDestinationInput {
  id: string;
  title: string;
  deleted_at: string | null;
}

export function productionAssetDestinations<T extends ProductionAssetDestinationInput>(
  productions: readonly T[],
) {
  return productions
    .filter((production) => production.deleted_at === null)
    .map((production) => ({
      id: production.id,
      title: production.title,
      href: `/studio/productions/${encodeURIComponent(production.id)}/assets`,
    }));
}
