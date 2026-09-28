import type { CharacterProfileProvenance } from "../types/character";

export function characterProfileProvenancePatch(
  profileProvenance: CharacterProfileProvenance | undefined
): { profile_provenance?: CharacterProfileProvenance } {
  return profileProvenance === undefined ? {} : { profile_provenance: profileProvenance };
}
