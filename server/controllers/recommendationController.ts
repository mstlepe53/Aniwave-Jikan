import { Request, Response } from 'express';

const ANILIST = 'https://graphql.anilist.co';

async function fetchAniList(query: string, variables = {}): Promise<any> {
  const res = await fetch(ANILIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(8000),
  });
  const json: any = await res.json();
  return json.data;
}

function normalize(a: any) {
  return {
    id: a.id,
    title: a.title?.english || a.title?.romaji || '',
    image: a.coverImage?.extraLarge || a.coverImage?.large || '',
    type: 'anime',
    rating: a.averageScore ? `${a.averageScore}%` : undefined,
    episodes: a.episodes ? `${a.episodes} EP` : undefined,
    year: a.seasonYear ? String(a.seasonYear) : '',
  };
}

export async function getRecommendations(_req: Request, res: Response) {
  try {
    const data = await fetchAniList(`{ Page(perPage:20) { media(sort:TRENDING_DESC,type:ANIME,isAdult:false) { id title{english romaji} coverImage{extraLarge large} averageScore episodes seasonYear } } }`);
    res.json({ results: (data.Page.media || []).map(normalize) });
  } catch { res.status(500).json({ error: 'Failed' }); }
}

export async function getRecommendationSections(_req: Request, res: Response) {
  try {
    const [trending, popular, topRated] = await Promise.all([
      fetchAniList(`{ Page(perPage:10) { media(sort:TRENDING_DESC,type:ANIME,isAdult:false) { id title{english romaji} coverImage{extraLarge large} averageScore episodes seasonYear } } }`),
      fetchAniList(`{ Page(perPage:10) { media(sort:POPULARITY_DESC,type:ANIME,isAdult:false) { id title{english romaji} coverImage{extraLarge large} averageScore episodes seasonYear } } }`),
      fetchAniList(`{ Page(perPage:10) { media(sort:SCORE_DESC,type:ANIME,isAdult:false) { id title{english romaji} coverImage{extraLarge large} averageScore episodes seasonYear } } }`),
    ]);
    res.json({ sections: [
      { title: 'Trending Anime', items: (trending.Page.media||[]).map(normalize) },
      { title: 'Most Popular', items: (popular.Page.media||[]).map(normalize) },
      { title: 'Top Rated', items: (topRated.Page.media||[]).map(normalize) },
    ]});
  } catch { res.status(500).json({ error: 'Failed' }); }
}
