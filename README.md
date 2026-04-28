# AnimeVault – AniList Edition

Stream anime free in HD with Sub & Dub support.

## Stack
- **AniList GraphQL API** – anime metadata, genres, characters, images
- **Embed servers** – MegaPlay (Fast) + VidNest
- **MongoDB** – user accounts, favorites, watchlist, comments, XP
- **React + Vite + Tailwind** – frontend
- **Express (Vercel serverless)** – backend API

## Embed URL Format
| Audio | Server | URL |
|-------|--------|-----|
| SUB   | Fast   | `https://megaplay.buzz/stream/ani/{id}/{episode}/sub` |
| DUB   | Fast   | `https://megaplay.buzz/stream/ani/{id}/{episode}/dub` |
| SUB   | VidNest| `https://vidnest.fun/animepahe/{id}/{episode}/sub` |
| DUB   | VidNest| `https://vidnest.fun/animepahe/{id}/{episode}/dub` |

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set these **Environment Variables**:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://rihanmonon7_db_user:YOUR_PASSWORD@streamvalut.v43wavs.mongodb.net/animevault?retryWrites=true&w=majority&appName=streamvalut` |
| `JWT_SECRET` | any random 32+ char string |
| `SITE_URL` | `https://your-project.vercel.app` |

> **MongoDB note:** No tables needed! MongoDB is schema-less. Collections are created automatically when users register. Just set the connection string.

4. Click **Deploy** ✅

## Local Dev
```bash
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET
npm run dev
```
