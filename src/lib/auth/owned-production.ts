export interface OwnedRecord {
  id: string;
  owner_id: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getOwnedProduction<T extends OwnedRecord>(
  productionId: string,
  userId: string,
  lookup: (id: string) => Promise<T | null>,
): Promise<T | null> {
  if (!UUID_PATTERN.test(productionId)) return null;

  const production = await lookup(productionId);
  if (
    !production ||
    production.id.toLowerCase() !== productionId.toLowerCase() ||
    production.owner_id !== userId
  ) {
    return null;
  }

  return production;
}
