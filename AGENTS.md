# AGENTS.md

## Stack & scope
- Expo (SDK ~58) + Expo Router app targeting **web only** (`app.config.js` sets `platforms: ["web"]`, `web.output: "static"`, `bundler: "metro"` with `apiRoutes: true`).
- UI/styling: React 19, React Native Web, NativeWind v4 + Tailwind v3. Global CSS entry is `src/stylesheets/global.css` (wired in `metro.config.js`).
- Plain JavaScript codebase: no TypeScript dependency and no lint/test/typecheck scripts. Types are documented with JSDoc (`@module`, `@typedef`/`@type`, `@param`, `@returns` — never `@example`).
- Data: Supabase. Development and local static builds use the **local** Supabase stack (PostgreSQL in Docker, `supabase/` config + migrations); Expo Hosting deploys use the **hosted** Supabase project. There is no cross-environment fallback.
- Auth/API: Expo Router API routes under `src/app/api/` handle authentication/authorization and data access. Server routes select Supabase at runtime via `src/shared/supabase-server.js` (anon key + forwarded user tokens, RLS enforced); never use or expose a service-role key.
- The app is intentionally minimal: `src/screens/root.js` is the starter screen. Add routes and screens following the conventions below.

## Commands (from `package.json`)
- `npm run expo:start` — starts the dev server on `$URL_PORT` after sourcing `.env`; requires `.env`.
- `npm run expo:start:tunnel` — dev server with tunnel.
- `npm run expo:build` — `expo export --platform web --output-dir build` (static export to `build/`).
- `npm run expo:serve` — serves `build/` on `$URL_PORT` (loads `.env`).
- `npm run opencode` — launches OpenCode (loads `.env`).
- Caddy: `npm run caddy` (loads `.env` via `--envfile`); `npm run caddy:trust`.
- Docker: `npm run docker:build|up|down|logs`; `npm run docker` runs the full cycle and stays attached to logs.
- Supabase: `npm run supabase:start|stop|status|reset|migration` for the local stack, and `npm run supabase:login|link|push` for the hosted project (all invoke the CLI via `npx`, separate from the app Docker compose). `supabase:link` reads `SUPABASE_PROJECT_REF` from `.env`.
- Deploy: `npm run eas:initialize`, `npm run eas:deploy`, `npm run github:remote`, `npm run github:secrets`, `npm run github:deploy`.

## Project structure / conventions
- **No absolute paths anywhere in the project** (source, configs, docs). Use workspace-relative paths; exception: `node_modules/` internals may do what the tooling requires.
- Routing uses Expo Router file-based routes under `src/app/` (`_layout.js`, `index.js`, `+not-found.js`, `+html.js`). Screens live under `src/screens/`; the home screen is `src/screens/root.js`.
- Shared modules live under `src/shared/`: `config.js` (client config), `supabase.js` (browser client selector), `supabase-server.js` (server route client selector), `api.js` (response helpers), `api-auth.js` (auth/profile/role helpers).
- Data lives under `supabase/`: `config.toml` (local ports/auth URLs), `migrations/*.sql` (schema + RLS, including `profiles`), and `seed.sql` (menu + seeded admin `root`/`R0.t`). Do not edit generated Supabase state under `supabase/.temp/` or `supabase/.branches/`.
- API routes use Expo Router `+api` naming under `src/app/api/` (e.g. `health+api.js`, `menu-items+api.js`, `auth/sign-in+api.js`, `auth/session+api.js`, `auth/sign-out+api.js`, `admin/profiles+api.js`) plus special routes `manifest.json+api.js`, `robots.txt+api.js`, `service-worker.js+api.js`.
- `app.config.js` derives app name/version from `EXPO_PUBLIC_TITLE`/`EXPO_PUBLIC_VERSION` and the Expo/EAS slug from `EAS_PROJECT_SLUG`.
- Assets: `png/logo.png` (full-size transparent-background favicon/PWA icon), `png/logo-maskable.png` (transparent-background, safe-zone maskable PWA icon), `svg/logo.svg` and `svg/logo-maskable.svg` (editable sources), `ttf/Outfit-VariableFont_wght.ttf` (custom font loaded in `src/app/_layout.js`).
- **Never create a `public/` directory and never move icon assets there.** Static icon PNGs stay in `png/` (SVG sources in `svg/`); `npm run expo:build` copies `png/logo.png` and `png/logo-maskable.png` into `build/client/png/` so the manifest can use stable `/png/...` URLs.

## Runtime & deployment notes
- `.env` holds `EXPO_PUBLIC_*` (bundled/client-visible), server/proxy vars (`URL_PROTOCOL`, `URL_HOST`, `URL_PORT`, `URL_PROXY_PROTOCOL`, `URL_PROXY_HOST`, `URL_PROXY_PORT`, `URL_BASE`, `URL_API`), Supabase credentials (`EXPO_PUBLIC_SUPABASE_*`, `SUPABASE_LOCAL_SERVER_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`), Expo/EAS deploy auth and linkage (`EAS_TOKEN`, `EAS_PROJECT_ID`, `EAS_PROJECT_SLUG`), and deploy-push config (`GH_TOKEN`, `GH_REPO`).
- Supabase environment selection is enforced in `src/shared/supabase.js` (client) and `src/shared/supabase-server.js` (server): `EXPO_PUBLIC_SUPABASE_TARGET` defaults to `local`, and only `npm run eas:deploy` overrides it to `hosted`. Never add a fallback, never bypass the override, and never expose a service-role key.
- Server API routes use anon key + forwarded user bearer tokens so RLS applies. Dockerized local routes reach Kong via `SUPABASE_LOCAL_SERVER_URL` (`http://api.supabase.internal:8000`) by joining the external `supabase_network_paku-paku` network created by `supabase start`.
- The local Supabase stack is private to the machine (API `54321`, PostgreSQL `54322`, Studio `54323`, Mailpit `54324`); never proxy or tunnel those ports.
- `eas:deploy` requires hosted Supabase URL/anon key, exports the web build, and runs `eas deploy --prod --environment production` so EAS production env vars are available to server-side API routes.
- `opencode.json` declares the hosted Supabase MCP server; its URL uses `{env:SUPABASE_PROJECT_REF}` from `.env`. OpenCode must be launched via `npm run opencode` (which sources `.env`) for substitution; authenticate once through `/mcps`.
- Several npm scripts source `.env` via `set -a && . ./.env && set +a`; `caddy` uses `--envfile`. Keep `.env` POSIX-compatible.
- `Dockerfile` + `docker-compose.yml` build/serve the static app and API routes; PostgreSQL/Supabase containers are external (local `supabase start` stack) and never part of the production image.
- `/api/health` returns `{status: "ok", timestamp, uptime}` with `Cache-Control: no-store`; the Docker healthcheck hits it.
- `.github/workflows/deploy.yml` runs on pushes to `main` (and manual dispatch): it restores `.env` from the `DOT_ENV` secret, installs dependencies, exports the web build on the runner, and uploads only the artifact to Expo Hosting via `npm run eas:deploy`.
- `build/`, `node_modules/`, and `.expo/` are generated/installed artifacts (gitignored). Edit source under `src/` and config at the repo root, not `build/`. |

## Maintenance
- Whenever possible, update `README.md` and `CONTRIBUTING.md` to reflect relevant changes (behavior, config, conventions, workflows).
- Whenever possible, update `.*ignore*` files when new generated artifacts, local files, or build outputs should be excluded.
- Follow the commit rules in `CONTRIBUTING.md` (**Commits & PRs**): commit automatically as work completes, using the tagged types and message format defined there — but never push automatically; pushes are always explicit requests.
