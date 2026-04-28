/**
 * AI Service Layer — Phase 7
 *
 * Provides optional AI-assisted scoring and rule-based fallbacks.
 * The app works fully even if AI is unavailable or not configured.
 *
 * Rule-based scoring considers:
 *  - Genre match with user's top genres
 *  - Recency (newer content gets a boost)
 *  - Popularity signals (if available)
 *
 * If OPENAI_API_KEY is set, an optional AI re-ranking call is made.
 * On any failure it silently falls back to rule-based scores.
 */

export interface UserProfile {
  topGenres: string[];       // e.g. ["Romance", "Action"]
  watchedIds: Set<string>;   // drama IDs the user already watched
}

export interface ScoredDrama {
  drama: Record<string, unknown>;
  score: number;
}

/** Compute a rule-based relevance score for a single drama. */
function ruleBasedScore(drama: Record<string, unknown>, profile: UserProfile): number {
  let score = 0;

  // Genre match: +20 for each genre that matches user's top genres
  const genres: string[] = Array.isArray(drama.genre)
    ? drama.genre
    : typeof drama.genre === 'string'
      ? [drama.genre]
      : [];

  for (const g of genres) {
    const idx = profile.topGenres.findIndex(
      tg => tg.toLowerCase() === g.toLowerCase(),
    );
    if (idx >= 0) {
      // First genre match gets more weight
      score += 20 - idx * 5;
    }
  }

  // Recency boost: extract year and prefer recent content
  const year = Number(drama.year ?? drama.releaseYear ?? 0);
  if (year >= 2024) score += 15;
  else if (year >= 2022) score += 10;
  else if (year >= 2020) score += 5;

  // Already watched — should have been filtered out, but extra safety
  const id = String(drama.id ?? drama.dramaId ?? '');
  if (id && profile.watchedIds.has(id)) score -= 1000;

  return score;
}

/** Rank dramas using rule-based scoring (no external calls). */
export function rankDramasRuleBased(
  dramas: Record<string, unknown>[],
  profile: UserProfile,
): ScoredDrama[] {
  return dramas
    .map(drama => ({ drama, score: ruleBasedScore(drama, profile) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Main ranking function.
 * Uses rule-based scoring and optionally AI re-ranking.
 * Always safe to call — falls back gracefully on any error.
 */
export async function rankDramas(
  dramas: Record<string, unknown>[],
  profile: UserProfile,
): Promise<Record<string, unknown>[]> {
  if (dramas.length === 0) return [];

  // Always compute rule-based scores first
  const scored = rankDramasRuleBased(dramas, profile);

  // Optional: AI-assisted re-ranking (only if API key is configured)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || dramas.length < 5) {
    return scored.map(s => s.drama);
  }

  try {
    // Build a compact prompt for re-ranking top candidates
    const topCandidates = scored.slice(0, 20).map((s, i) => ({
      rank: i + 1,
      id: String(s.drama.id ?? s.drama.dramaId ?? i),
      title: String(s.drama.title ?? ''),
      genre: s.drama.genre,
      year: s.drama.year,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'You are a drama recommendation assistant. Re-rank the following dramas for a user whose favorite genres are: ' +
              profile.topGenres.join(', ') +
              '. Return ONLY a JSON array of IDs in your recommended order, no explanation.',
          },
          {
            role: 'user',
            content: JSON.stringify(topCandidates),
          },
        ],
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) throw new Error('AI API error');

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? '';
    const rerankedIds: string[] = JSON.parse(content);

    if (!Array.isArray(rerankedIds)) throw new Error('Invalid AI response');

    // Re-order the scored dramas based on AI ranking
    const idToIndex = new Map(rerankedIds.map((id, i) => [String(id), i]));
    const top20 = scored.slice(0, 20);
    const rest = scored.slice(20);

    top20.sort((a, b) => {
      const idA = String(a.drama.id ?? a.drama.dramaId ?? '');
      const idB = String(b.drama.id ?? b.drama.dramaId ?? '');
      const rankA = idToIndex.get(idA) ?? 999;
      const rankB = idToIndex.get(idB) ?? 999;
      return rankA - rankB;
    });

    return [...top20, ...rest].map(s => s.drama);
  } catch {
    // AI failed silently — return rule-based ranking
    return scored.map(s => s.drama);
  }
}

/**
 * Generate a quality score for a comment using heuristics.
 * Higher = better quality.
 */
export function scoreComment(comment: {
  content: string;
  likeCount: number;
  replyCount?: number;
  createdAt: string;
}): number {
  let score = 0;

  // Like count is the strongest signal
  score += comment.likeCount * 10;

  // Replies suggest engagement
  score += (comment.replyCount ?? 0) * 5;

  // Reasonable length (50-500 chars) is a quality signal
  const len = comment.content.length;
  if (len >= 50 && len <= 500) score += 10;
  else if (len >= 20 && len < 50) score += 5;

  // Penalize very short content (likely low quality)
  if (len < 10) score -= 20;

  // Spam detection: excessive punctuation or caps
  const capsRatio = (comment.content.match(/[A-Z]/g) ?? []).length / Math.max(len, 1);
  if (capsRatio > 0.5) score -= 15;

  const punctRatio = (comment.content.match(/[!?]{2,}/g) ?? []).length;
  if (punctRatio > 3) score -= 10;

  return score;
}

/**
 * Simple spam/low-quality detector using heuristics.
 * Returns true if the content looks like spam.
 */
export function isLikelySpam(content: string): boolean {
  if (!content) return true;
  const trimmed = content.trim();

  // Too short
  if (trimmed.length < 3) return true;

  // Repeated characters (e.g., "aaaaaaaa")
  if (/(.)\1{8,}/.test(trimmed)) return true;

  // Excessive links
  const urlCount = (trimmed.match(/https?:\/\//g) ?? []).length;
  if (urlCount > 2) return true;

  return false;
}
