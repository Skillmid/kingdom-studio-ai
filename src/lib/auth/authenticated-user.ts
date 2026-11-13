export interface AuthenticatedUser { id: string }

interface ClaimsLookupResult {
  data: { claims: { sub?: unknown } | null } | null;
  error: unknown | null;
}

export async function getAuthenticatedUser(
  getClaims: () => Promise<ClaimsLookupResult>,
): Promise<AuthenticatedUser | null> {
  try {
    const { data, error } = await getClaims();
    const subject = data?.claims?.sub;
    if (error || typeof subject !== "string" || !subject) {
      return null;
    }
    return { id: subject };
  } catch {
    return null;
  }
}
