/**
 * Recommendation API — Phase 7
 * Fetches multi-section personalized recommendations for the home page.
 */

export interface RecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  genre?: string;
  dramas: Record<string, unknown>[];
}

export interface RecommendationSectionsResponse {
  sections: RecommendationSection[];
  topGenres?: string[];
}

/** Fetch personalized recommendation sections for the home page. */
export async function getRecommendationSections(
  token?: string | null,
): Promise<RecommendationSectionsResponse> {
  try {
    const res = await fetch('/api/recommendations/sections', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return { sections: [] };
    return res.json() as Promise<RecommendationSectionsResponse>;
  } catch {
    return { sections: [] };
  }
}
