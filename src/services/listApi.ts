const BASE = '';

export interface ListItem {
  dramaId: string;
  title: string;
  image: string;
  addedAt: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json() as Promise<T>;
}

// ─── Favorites ──────────────────────────────────────────────────────────────

export function getFavorites(token: string): Promise<ListItem[]> {
  return apiFetch('/api/lists/favorites', { headers: { Authorization: `Bearer ${token}` } });
}

export function toggleFavorite(token: string, dramaId: string, title: string, image: string): Promise<{ favorited: boolean }> {
  return apiFetch('/api/lists/favorites/toggle', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dramaId, title, image }),
  });
}

export function checkFavorite(token: string, dramaId: string): Promise<{ favorited: boolean }> {
  return apiFetch(`/api/lists/favorites/${encodeURIComponent(dramaId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function removeFavorite(token: string, dramaId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/lists/favorites/${encodeURIComponent(dramaId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

export function getWatchlist(token: string): Promise<ListItem[]> {
  return apiFetch('/api/lists/watchlist', { headers: { Authorization: `Bearer ${token}` } });
}

export function toggleWatchlist(token: string, dramaId: string, title: string, image: string): Promise<{ watchlisted: boolean }> {
  return apiFetch('/api/lists/watchlist/toggle', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dramaId, title, image }),
  });
}

export function checkWatchlist(token: string, dramaId: string): Promise<{ watchlisted: boolean }> {
  return apiFetch(`/api/lists/watchlist/${encodeURIComponent(dramaId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function removeWatchlist(token: string, dramaId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/lists/watchlist/${encodeURIComponent(dramaId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
