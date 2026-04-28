# Dramalie

A streaming platform web app for browsing and watching dramas and anime.

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6
- **Backend:** Node.js + Express
- **Authentication:** JWT with bcrypt password hashing
- **Database:** MongoDB Atlas via Mongoose (all collections)
- **Styling:** Tailwind CSS 4
- **Routing:** React Router 7
- **Icons:** Lucide React
- **Animations:** Motion (Framer Motion)

## Project Layout

```
/src
  main.tsx         - App entry point
  App.tsx          - Root component with routes
  index.css        - Global styles / Tailwind
  /components      - Reusable UI components (Layout, Toast, ShowCard, etc.)
  /context         - React contexts, including authentication state
  /pages           - Page components (Home, ShowDetails, Watch, Listing, Search, Profile, PublicProfile, NotFound)
  /services        - API service layer (api.ts, authApi.ts, profileApi.ts, commentApi.ts)
  /hooks           - Custom React hooks (useQueries, useFetch, usePWAInstall)
/server
  /config          - MongoDB Atlas connection (Mongoose)
  /controllers     - Express route controllers
  /middleware      - Auth middleware
  /models          - Mongoose models (MongoDB collections)
  /routes          - API routes
index.html         - HTML template
vite.config.ts     - Vite config (port 5000, all hosts allowed)
package.json       - Dependencies and scripts
```

## Development

```bash
npm install
npm run dev        # Starts on port 5000
```

## Authentication

- Sign up, login, logout
- JWT session persistence (userId stored as MongoDB ObjectId hex string)
- Protected dashboard and profile routes
- `users` collection via Mongoose; no manual schema migrations needed
- Safe user API responses without password hashes

## MongoDB Collections

All data stored in MongoDB Atlas (`dramalie` database by default):

| Collection | Purpose |
|---|---|
| `users` | Auth, profile, xp, level, watchTime, avatar, bio |
| `comments` | Episode comments and replies (parentId = ObjectId) |
| `commentreactions` | Per-user likes, compound unique index |
| `follows` | Follower/following pairs, compound unique index |
| `watchprogresses` | Per-user episode progress, upserted |
| `favorites` | Saved drama favorites, compound unique index |
| `watchlists` | Watch-later list, compound unique index |
| `notifications` | In-app notifications with priority sorting |
| `userbadges` | Earned badges per user |
| `userrewards` | Daily reward streak tracking |
| `useractivities` | Drama view tracking for recommendations |
| `usersearchhistories` | Per-user recent searches |
| `globalsearchqueries` | Globally trending search queries |

## Phase 5 — Advanced User Engagement

### Follow System
- `follows` collection with compound unique index on (followerUserId, followingUserId)
- Endpoints: POST/DELETE `/api/profile/user/:username/follow`, GET `/api/profile/user/:username/followers|following`
- Cannot self-follow; duplicate-follow prevention via unique index + error swallowing

### XP & Level System
- `users` document stores `xp`, `level`, `watchTime` fields
- XP rules: +5 XP per comment, +3 XP per reply, +10 XP per 10 minutes watched
- Level formula: `max(1, floor(xp / 100) + 1)` via MongoDB aggregation pipeline update
- Watch-time tracking: Watch page tracks elapsed time, reports 600 s chunks every 10 minutes

### Badges System
- Predefined badge catalogue hardcoded in `server/models/badgeModel.ts`
- `userbadges` collection tracks earned badges with compound unique index
- Badges: First Comment (1 comment), Commenter (10 comments), Social (5 followers), Early Bird (first 50 users), Rising Star (level ≥ 5)
- Badges auto-awarded fire-and-forget on comment, reply, follow actions

### User Hover Card
- `UserHoverCard` component wraps username/avatar in comments; renders a portal popup on hover
- Shows avatar, username, level badge, XP progress bar, follower/comment stats, and follow button
- Session-level profile cache avoids redundant API calls; 350 ms open delay, 150 ms close delay

### Performance & Security
- All MongoDB collections created with appropriate indexes at model registration time
- Comment + reply rate limit: max 1 post per 10 seconds per user (in-memory)
- Watch-time rate limit: max 1 call per 60 seconds per user
- Input sanitization: HTML tags stripped from comment content; profile update values validated
- API queries use parameterized statements throughout (no string interpolation)

Required environment variables for live auth:
- `JWT_SECRET`
- `MONGODB_URI` — MongoDB Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/`)
- Optional: `MONGODB_DB` — database name (default: `dramalie`)

## Replit Setup

- Package manager: npm (`package-lock.json`)
- App location: project root
- Dev command: `npm run dev` → runs `tsx server/index.ts`
- Dev server: Express on `0.0.0.0:5000` with embedded Vite middleware in development mode
- Workflow: "Start application" configured for port 5000 (webview)
- API CORS: same-origin friendly in development; production accepts only origins listed in `CORS_ORIGIN` or comma-separated `CORS_ORIGINS`
- Frontend auth/profile/comment API clients use same-origin `/api/...` paths so stale localhost `VITE_AUTH_API_BASE_URL` values cannot break Replit preview signup.

## Environment Variables / Secrets

All secrets must be set via Replit Secrets (never in .env for production):
- `JWT_SECRET` — Required for authentication
- `MONGODB_URI` — Required for database (MongoDB Atlas connection string)
- Optional: `MONGODB_DB` — Database name (default: `dramalie`)
- Optional: `CORS_ORIGIN` or `CORS_ORIGINS` — Allowed frontend origin(s) for production API requests
- Optional: `OPENAI_API_KEY` — Enables AI-powered recommendation re-ranking

## Phase 6 — Recommendations, Notifications & PWA

- Personalized drama recommendations via `/api/recommendations` (fallback to popular if no watch history)
- In-app notification system (`notifications` table) with unread count badge in header
- PWA support: `manifest.webmanifest`, service worker registration, offline fallback, `InstallPrompt` component
- Footer shows version `v1.9.0`

## Phase 7 — AI-Powered Intelligence Features

### Search Intelligence
- `searchHistoryModel.ts` — per-user saved queries + global trending query aggregation (7-day rolling window)
- `searchController.ts` + `searchRoutes.ts` — POST `/api/search/track`, GET/DELETE `/api/search/history`, GET `/api/search/trending`
- Layout.tsx header search bar shows a dropdown with recent searches and trending chips (debounced, keyboard navigable)
- Search.tsx shows recent/trending chips above results with one-click autofill

### AI Service Layer
- `aiService.ts` — rule-based content scoring (genre match, recency, rating, popularity) with optional OpenAI re-ranking if `OPENAI_API_KEY` is set
- Spam/quality detection for comments (keyword list, length, caps-ratio heuristics)
- `recommendationApi.ts` — frontend client for `/api/recommendations/sections`

### Enhanced Recommendation Sections
- `recommendationController.ts` extended with `/api/recommendations/sections` endpoint
- Returns up to 4 named sections: "For You" (personalized), "Because You Watched" (genre-based), "Trending Now", "Top Rated"
- Each section has `id`, `title`, `subtitle`, `icon`, and `dramas[]`
- `Home.tsx` renders all sections via `RecommendationSectionBlock` component with per-section icons and a "#1 Pick" badge

### Comment Helpfulness Sorting
- `commentModel.ts` + `commentController.ts` support `?sort=helpful` (by like_count DESC) or default `recent`
- `CommentSection.tsx` shows Recent / Helpful sort tabs
- `CommentItem.tsx` shows a "Top Comment" badge on the most-liked comment when in helpful sort mode

### Notification Priority
- `notifications` table gains a `priority` column (ALTER TABLE migration, safe to re-run)
- `notificationModel.ts` orders by priority DESC then created_at DESC
- `NotificationBell.tsx` groups notifications into High Priority and Recent sections

### Optional Environment Variable
- `OPENAI_API_KEY` — if set, the AI service uses GPT for smart content re-ranking; otherwise falls back to deterministic rule-based scoring

## Phase 8 — Server-Rendered SEO Infrastructure

- Public SEO routes are server-rendered through Express before the React/Vite fallback so crawlers receive complete HTML, not an empty SPA shell.
- Canonical drama URLs now use `/drama/:id`; legacy `/show/:id` remains supported for compatibility.
- Server-rendered pages include dynamic titles, meta descriptions, canonical tags, Open Graph/Twitter tags, WebSite/Organization JSON-LD, BreadcrumbList, TVSeries, Episode, VideoObject, and ItemList schema as appropriate.
- Dynamic crawl endpoints:
  - `/robots.txt` allows public content and blocks API/auth/search utility routes.
  - `/sitemap.xml` is generated from upstream homepage, listing, genre, country, drama, and episode data with a 24-hour in-memory refresh window.
- Main internal links now point to canonical `/drama/...` URLs for drama details while episode pages remain `/watch/...`.
- SEO data fetching uses short-lived in-memory caching to reduce upstream API load without slowing the visible app.

## Phase 9 — Favorites & Watchlist

- `favorites` and `watchlist` MongoDB collections with compound unique indexes
- Backend models: `server/models/favoriteModel.ts`, `server/models/watchlistModel.ts`
- Controller + routes: `server/controllers/listController.ts`, `server/routes/listRoutes.ts`
- All endpoints require `Authorization: Bearer {token}`:
  - GET/POST/DELETE `/api/lists/favorites`
  - GET/POST/DELETE `/api/lists/watchlist`
- Frontend service: `src/services/listApi.ts` (getFavorites, addFavorite, removeFavorite, getWatchlist, addWatchlist, removeWatchlist)
- Reusable hook: `src/hooks/useList.ts` — manages toggle state + optimistic updates
- Heart (favorite) and Bookmark (watchlist) buttons on ShowDetails.tsx and Watch.tsx
- Profile.tsx shows "My Favorites" and "My Watchlist" card grids with hover-to-remove trash button

## Bug Fixes — SQL → MongoDB Migration (ID Types)

After the SQL→MongoDB migration all numeric (`number`) ID types in frontend TypeScript interfaces were updated to `string` (MongoDB ObjectIds are hex strings, not integers):

- `src/services/commentApi.ts` — `CommentAuthor.id`, `Comment.id`, `Comment.userId`, `Comment.parentId`, and all function params (`createReply`, `editComment`, `deleteComment`, `toggleReaction`)
- `src/services/profileApi.ts` — `PublicUser.id`, `FollowListUser.id`, `recentComments[].id / parentId`
- `src/services/leaderboardApi.ts` — `LeaderboardUser.id`
- `src/components/comments/CommentSection.tsx` — `handleUpdate`, `handleDelete`, `handleReplyAdded` params
- `src/components/comments/CommentItem.tsx` — `onUpdate`, `onDelete`, `onReplyAdded` prop types
- `src/pages/Watch.tsx` — genre is now captured via a `genreRef` and correctly passed to `saveWatchProgress`, enabling accurate personalized recommendations based on watch history

## Daily Reward System — Bug Fixes (Apr 2026)

- **`DailyRewardPopup`** — `handleDismiss` no longer sets the sessionStorage key; the key is now only written after a *successful* claim. This means users who close the popup without claiming will see it again on their next visit to the home page.
- **`rewardApi.ts`** — `claimDailyReward` now returns a typed `ClaimResult` (`success`, `data`, `message`, `alreadyClaimed`, `nextClaimAt`) instead of `RewardStatus | null`, so callers can display proper error messages.
- **`DailyRewardPopup`** — Added inline error message display (red banner with `AlertCircle` icon) when a claim attempt fails, with a `disabled` state on the button during the request.
- **`Profile.tsx`** — Added a "Daily Reward" card that fetches reward status on mount and lets users claim directly from their profile page (streak counter, XP preview, error feedback, "already claimed" state with next-claim time).
- **`profileController.ts`** — `editProfile` response now includes `watchTime` so the frontend `setUser` spread doesn't clobber the field.
- **`userModel.ts`** — Replaced deprecated `{ new: true }` Mongoose option with `{ returnDocument: 'after' }` in `updateUserProfile`, `awardXP`, and `addWatchTime`.

## Deployment

- Build: `npm run build` → Vite outputs to `dist/`, TSC compiles server
- Start: `npm run start` → runs compiled `dist/server/index.js`
