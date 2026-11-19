# AGENTS.md

## Stack & scope
- Expo (SDK ~58) + Expo Router app targeting **web only** (`app.config.js`: `platforms: ["web"]`, `web.output: "static"`, `bundler: "metro"`, `apiRoutes: true`). UI/state: React 19, React Native Web, NativeWind v4 + Tailwind v3, Zustand. Global CSS: `src/shared/stylesheets/global.css` (wired in `metro.config.js`).
- Plain JavaScript only (no TypeScript). JSDoc for modules/exports (`@module`, `@typedef`/`@type`, `@param`, `@returns` — never `@example`). No lint/typecheck scripts; `npm test` runs `bun test` but there are no app tests.
- Supabase-backed: **local** stack for dev/local builds, **hosted** only for Expo Hosting deploys. No cross-environment fallback. Server routes use anon key + forwarded user bearer tokens via `src/database/instance.js` (RLS enforced); never use/expose a service-role key.

## Commands
- `npm run expo:start` / `expo:start:tunnel` — dev server (sources `.env`, uses `$URL_PORT`). `npm run expo:build` — `expo export --platform web --output-dir build` and copies `png/logo*.png` to `build/client/png/`. `npm run expo:serve` — serve `build/` on `$URL_PORT`.
- Supabase local: `supabase:start|stop|status|reset|migration` (`npx supabase`, separate from app Docker). Hosted: `supabase:link` (reads `SUPABASE_PROJECT_REF`) and `supabase:push`; `supabase:reset:remote` drops/reapplies hosted schema then pushes (destructive).
- Docker/app: `docker:build|up|down|logs`, `docker` (full cycle). `caddy` / `caddy:trust`. `opencode` launches OpenCode with `.env` loaded (required for `opencode.json` env substitution if added).
- Deploy/ops: `eas:initialize`, `eas:deploy` (forces `EXPO_PUBLIC_SUPABASE_TARGET=hosted`, exports, `eas deploy --prod --environment production`), `github:remote|secrets|deploy`, `github:workflow:supabase|expo`.
- Scripts source `.env` via `set -a && . ./.env && set +a` (Caddy uses `--envfile`); keep `.env` POSIX-compatible.

## Architecture & conventions
- **No absolute paths** in source/config/docs (except `node_modules/`). Do not create `public/`; static icons stay in `png/` (sources in `svg/`).
- Only `/` and `/signin` are public pages. Protected customer UI routes use `src/app/(customer)/` (`/menu`, `/cart`, `/checkout`) with a `customer`-role guard; visitors sign in with the single shared guest profile (no signup).
- Protected staff UI routes use the `src/app/(staff)/` route group with a layout guard that requires the `staff` role: `/staff/order` for order taking and `/staff/records` for order logs.
- Protected admin UI routes use the `src/app/(admin)/` route group with a `_layout.js` auth guard (URLs remain `/admin/*`). The profiles audit page lists every seeded profile.
- Routing: Expo Router under `src/app/` (`api/**/+api.js`, `+not-found.js`, `+html.js`, special `manifest.json+api.js`, `robots.txt+api.js`, `service-worker.js+api.js`). Screens in `src/screens/` mirror route paths (`*.screen.js` layout modules, e.g. `root.js`, `signin/signin.screen.js`, `admin/profiles/profiles.screen.js`); reusable UI in `src/components/`.
- Layers (keep consistent): `src/app/api/*` are thin wrappers exporting HTTP methods → `src/endpoints/*` compose middleware/request/validation/repos/response (mirror API paths) → `src/interceptors/*` (`log`, `error`, `authentication`, `authorization`, `method`, `body`) → `src/repositories/*` → `src/database/instance.js`. Client side: `src/services/*` → `src/stores/*`. Shared: `src/shared/{constants,network,cipher,errors,stylesheets}`. No barrel `index.js` in `interceptors/` or `endpoints/`.
- DB config/clients: `src/shared/constants/config.js` is the single source of truth (API endpoints incl. `checkout`, DB target/URLs). `src/database/instance.js` exports `getDatabaseClient()`, `getDatabaseServerConfig()`, `createDatabaseClient({ accessToken })` (not `getSupabase*`).
- Supabase data lives in `supabase/config.toml`, `migrations/*.sql`, `seeds/*.sql` (items + seeded `admin@`, `staff@`, and shared `guest@paku-paku.official` accounts, internal auth emails not exposed). Do not edit `supabase/.temp/` or `.branches/`. Verify schema changes with `supabase:reset` and `expo:build` (and relevant `/api/*` flows when stack running).
- Local Supabase ports are private: API `54321`, PostgreSQL `54322`, Studio `54323`, Mailpit `54324` — never proxy/tunnel. Dockerized local routes reach Kong via `SUPABASE_LOCAL_SERVER_URL` (`http://api.supabase.internal:8000`) on external network `supabase_network_paku-paku` (start `supabase:start` before `docker:up`).
- CI/workflows: `.github/workflows/deploy-expo.yml` (export + `eas:deploy` artifact upload) and `deploy-supabase.yml` (link + push hosted migrations/seed), both restore `.env` from `DOT_ENV`, push to `main` or manual dispatch. EAS runs no builds.
- `build/`, `node_modules/`, `.expo/` are generated (gitignored); edit source/config only. `/api/health` returns `{status:"ok",timestamp,uptime}` with `Cache-Control: no-store`.

## Maintenance
- Update `README.md`/`CONTRIBUTING.md` and relevant `.*ignore*` files when behavior/config/workflows or generated outputs change.
- Commit as work completes using `CONTRIBUTING.md` tags/format (`(feature|chore|ui|fix|refactor)` + title + bulleted body). Never push automatically.
