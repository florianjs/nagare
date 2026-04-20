# CLAUDE.md

Codex will review your output once you are done.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Analytics platform. Nuxt 4 frontend + Convex backend. Real-time dashboard via Convex subscriptions. RGPD-friendly, cookieless tracking. Multi-site support. Heatmap via iframe of tracked site.

## Commands

```bash
npm install           # install deps
npm run dev           # Nuxt dev server localhost:3000
npx convex dev        # Convex dev (watches convex/ dir, pushes to dev deployment)
npm run build         # Nuxt production build
npm run preview       # local preview of build
npx convex deploy     # push Convex functions/schema to prod deployment
```

Run `npm run dev` and `npx convex dev` in parallel during development.

No test/lint scripts defined yet.

## Stack

- Nuxt 4 (`app/` dir convention)
- TailwindCSS (`@nuxtjs/tailwindcss`), `@nuxt/fonts`, `@nuxt/icon`
- Planned (not yet installed): `@nuxtjs/i18n`, `nuxt-auth-utils`, `convex`, `@convex-vue/core` (or direct Convex HTTP client)

## Architecture

Three concerns in one repo:

1. **Dashboard app** - authenticated Nuxt UI for site owners. Auth via `nuxt-auth-utils` (session cookies for dashboard operators only, NOT tracked visitors). i18n via `@nuxtjs/i18n`. Uses Convex client for live queries (realtime pageview/visitor counts).
2. **Ingest** - Convex HTTP actions (`convex/http.ts`) receive pageview/event/heatmap POSTs from tracker script. Validate site key, hash visitor ID, insert into Convex tables. Cookieless - fingerprint = hash(IP + UA + daily rotating salt).
3. **Tracker script** - public JS in `/public/t.js` (or generated via Nitro route). Multi-site key via `<script src="…/t.js" data-site-id="XYZ">`. Dependency-free, <3KB gzipped. POSTs to Convex HTTP action endpoint.

### Heatmap rendering

Dashboard iframes tracked site (`<iframe src="…">`) + overlays canvas with aggregated points from Convex. Tracked site must allow iframe embedding (document `X-Frame-Options` / CSP requirement, or proxy render route).

### Convex layout

- `convex/schema.ts` - tables: `sites`, `events`, `heatmapPoints`, `users`.
- `convex/queries.ts` - dashboard reads (getSiteStats, listEvents). These auto-subscribe → realtime dashboard.
- `convex/mutations.ts` - dashboard writes (createSite, rotateScriptKey).
- `convex/http.ts` - public ingest endpoints for tracker (no auth, rate-limited, site-key gated).
- `convex/crons.ts` - scheduled aggregation (hourly rollups to keep live queries cheap).
- `convex/auth.ts` - if using Convex Auth instead of nuxt-auth-utils. Decide one, not both.

### Data model (expected)

- `sites`: ownerId, domain, scriptKey, createdAt
- `events`: siteId, ts, path, type, visitorHash, referrer, uaFamily, country
- `heatmapPoints`: siteId, path, xRatio, yRatio, kind (click/move)
- `users`: managed by nuxt-auth-utils or Convex Auth
- `rollupsHourly`: siteId, hour, pageviews, uniques (denormalized for fast dashboard)

Index aggressively on `(siteId, ts)` and `(siteId, path)`.

## RGPD constraints (hard rules)

- No cookies, no localStorage for visitor identity. Daily salt hash only.
- No raw PII stored - hash IP before insert.
- Respect `DNT` / `Sec-GPC` headers → drop event silently.
- Dashboard operator cookies (session) are fine - logged-in users only.

## Deployment

- **Backend**: Convex auto-hosted. `npx convex deploy` pushes functions + schema.
- **Frontend**: Nuxt SSR on Cloudflare Workers via `wrangler deploy`. Convex does NOT host Nuxt SSR.
- **Env wiring**: `NUXT_PUBLIC_CONVEX_URL` must point to Convex prod deployment URL. `CONVEX_DEPLOY_KEY` only needed for CI auto-deploy, not initial install.

### One-command install flow (`install.sh`)

Target UX: user runs `./install.sh` after clone, gets a fully deployed stack. Script responsibilities:

1. Check `node`, `npm`, `git` present - abort with install hint if missing.
2. `npm install`.
3. `npx convex login` → browser OAuth.
4. `npx convex dev --once --configure new` → provisions Convex project, writes `.env.local` with `CONVEX_URL`.
5. `npx convex deploy --yes` → pushes schema/functions to prod.
6. `npx wrangler login` → browser OAuth.
7. Read `CONVEX_URL` from `.env.local`, push to CF via `wrangler secret put NUXT_PUBLIC_CONVEX_URL`.
8. `npx wrangler deploy` → ship Nuxt Worker.

Two browser popups total, zero key copy-paste. For Windows users, ship parallel `install.ps1`. README quickstart = `git clone && cd && ./install.sh`.

Note: pure one-click button (Vercel-Marketplace-style) does NOT exist for Convex + Cloudflare. `install.sh` is the closest honest equivalent.

## Conventions

- Nuxt 4: `app/` = client, `server/` at repo root = Nitro routes (minimal use, most logic in `convex/`).
- `convex/` at repo root = Convex functions + schema. Typed via `convex/_generated/`.
- Path alias `~/` → `app/`, `~~/` → repo root.
- Tracker script = no framework, no deps, hand-written for size.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
