import { Request, Response } from 'express';

const ANILIST = 'https://graphql.anilist.co';

export async function getTrending(_req: Request, res: Response) {
  try {
    const r = await fetch(ANILIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{ Page(perPage:20) { media(sort:TRENDING_DESC,type:ANIME,isAdult:false) { id title{english romaji} coverImage{extraLarge} averageScore episodes seasonYear } } }` }),
    });
    const json: any = await r.json();
    res.json({ results: (json.data?.Page?.media || []).map((a: any) => ({
      id: a.id, title: a.title?.english || a.title?.romaji, image: a.coverImage?.extraLarge,
      type: 'anime', rating: a.averageScore ? `${a.averageScore}%` : undefined, year: a.seasonYear ? String(a.seasonYear) : '',
    })) });
  } catch { res.status(500).json({ error: 'Failed' }); }
}
