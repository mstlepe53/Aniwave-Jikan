import { useState, useEffect, useCallback } from 'react';
import { checkFavorite, toggleFavorite, checkWatchlist, toggleWatchlist } from '../services/listApi';

/** Manages favorite + watchlist toggle state for a single drama. */
export function useList(dramaId: string, token: string | null, title: string, image: string) {
  const [favorited, setFavorited] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [wlLoading, setWlLoading] = useState(false);

  // Load initial state when token + dramaId available
  useEffect(() => {
    if (!token || !dramaId) return;
    checkFavorite(token, dramaId).then(r => setFavorited(r.favorited)).catch(() => {});
    checkWatchlist(token, dramaId).then(r => setWatchlisted(r.watchlisted)).catch(() => {});
  }, [token, dramaId]);

  const handleToggleFavorite = useCallback(async () => {
    if (!token || favLoading) return;
    setFavLoading(true);
    try {
      const result = await toggleFavorite(token, dramaId, title, image);
      setFavorited(result.favorited);
    } catch {
      // silently fail
    } finally {
      setFavLoading(false);
    }
  }, [token, dramaId, title, image, favLoading]);

  const handleToggleWatchlist = useCallback(async () => {
    if (!token || wlLoading) return;
    setWlLoading(true);
    try {
      const result = await toggleWatchlist(token, dramaId, title, image);
      setWatchlisted(result.watchlisted);
    } catch {
      // silently fail
    } finally {
      setWlLoading(false);
    }
  }, [token, dramaId, title, image, wlLoading]);

  return {
    favorited,
    watchlisted,
    favLoading,
    wlLoading,
    handleToggleFavorite,
    handleToggleWatchlist,
  };
}
