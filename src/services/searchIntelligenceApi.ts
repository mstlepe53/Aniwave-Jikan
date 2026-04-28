/**
 * Search Intelligence API — Phase 7
 * Wraps the backend search intelligence endpoints.
 */

const BASE = '/api/search';

/** Track a search query (fire-and-forget, safe to call on any search). */
export async function trackSearchQuery(query: string, token?: string | null): Promise<void> {
  try {
    await fetch(`${BASE}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query }),
    });
  } catch {
    // Fire-and-forget — silent failure is acceptable
  }
}

/** Get the logged-in user's recent search history. */
export async function getSearchHistory(token: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json() as { searches: string[] };
    return data.searches ?? [];
  } catch {
    return [];
  }
}

/** Clear the logged-in user's search history. */
export async function clearSearchHistory(token: string): Promise<void> {
  try {
    await fetch(`${BASE}/history`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Silent failure
  }
}

/** Get globally trending search queries. */
export async function getTrendingSearches(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/trending`);
    if (!res.ok) return [];
    const data = await res.json() as { trending: string[] };
    return data.trending ?? [];
  } catch {
    return [];
  }
}
