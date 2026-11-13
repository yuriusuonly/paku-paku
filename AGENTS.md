# AGENTS.md

## Stack & scope
- Expo (SDK ~58) + Expo Router app targeting **web only** (`app.config.js` sets `platforms: ["web"]`, `web.output: "static"`, `bundler: "metro"` with `apiRoutes: true`).
- UI/styling: React 19, React Native Web, NativeWind v4 + Tailwind v3. Global CSS entry is `src/stylesheets/global.css` (wired in `metro.config.js`).
- Plain JavaScript codebase: no TypeScript dependency and no lint/test/typecheck scripts. Types are documented with JSDoc (`@module`, `@typedef`/`@type`, `@param`, `@returns` — never `@example`).
- Data: Supabase. Development and local static builds use the **local** Supabase stack (PostgreSQL in Docker, `supabase/` config + migrations); Expo Hosting deploys use the **hosted** Supabase project. There is no cross-environment fallback.
- The app is intentionally empty: `src/screens/root.js` is the minimal starter screen. Add routes and screens following the conventions below.

## Commands (from `package.json`)
- `npm run expo:start` — starts the dev server on `$URL_PORT` after sourcing `.env`; requires `.env`.
- `npm run expo:start:tunnel` — dev server with tunnel.
- `npm run expo:build` — `expo export --platform web --output-dir build` (static export to `build/`).
- `npm run expo:serve` — serves `build/` on `$URL_PORT` (loads `.env`).
- `npm run opencode` — launches OpenCode (loads `.env`).
- Caddy: `npm run caddy` (loads `.env` via `--envfile`); `npm run caddy:trust`.
- Docker: `npm run docker:build|up|down|logs`; `npm run docker` runs the full cycle and stays attached to logs.
- Supabase: `npm run supabase:start|stop|status|reset|migration|check` for the local stack, and `npm run supabase:login|link|push` for the hosted project (all invoke the CLI via `npx`, separate from the app Docker compose). `supabase:link` reads `SUPABASE_PROJECT_REF` from `.env`.
- Deploy: `npm run eas:initialize`, `npm run eas:deploy`, `npm run github:remote`, `npm run github:secrets`, `npm run github:deploy`.

## Project structure / conventions
- **No absolute paths anywhere in the project** (source, configs, docs). Use workspace-relative paths; exception: `node_modules/` internals may do what the tooling requires.
- Routing uses Expo Router file-based routes under `src/app/` (`_layout.js`, `index.js`, `+not-found.js`, `+html.js`). Screens live under `src/screens/`; the home screen is `src/screens/root.js`.
- Shared modules live under `src/shared/` (`config.js` reads `EXPO_PUBLIC_*` env vars; `supabase.js` exports the lazy `getSupabase()` client and selects local vs hosted credentials).
- Data lives under `supabase/`: `config.toml` (local ports/auth URLs), `migrations/*.sql` (schema + RLS), and `seed.sql` (local seed data). Do not edit generated Supabase state under `supabase/.temp/` or `supabase/.branches/`.
- API/special routes follow Expo Router web conventions in filenames: `src/app/api/health+api.js`, `manifest.json+api.js`, `robots.txt+api.js`, `service-worker.js+api.js`.
- `app.config.js` derives app name/version from `EXPO_PUBLIC_TITLE`/`EXPO_PUBLIC_VERSION` and the Expo/EAS slug from `EAS_PROJECT_SLUG`.
- Assets: `png/logo.png` (full-size transparent-background favicon/PWA icon), `png/logo-maskable.png` (transparent-background, safe-zone maskable PWA icon), `svg/logo.svg` and `svg/logo-maskable.svg` (editable sources), `ttf/Outfit-VariableFont_wght.ttf` (custom font loaded in `src/app/_layout.js`).
- **Never create a `public/` directory and never move icon assets there.** Static icon PNGs stay in `png/` (SVG sources in `svg/`); `npm run expo:build` copies `png/logo.png` and `png/logo-maskable.png` into `build/client/png/` so the manifest can use stable `/png/...` URLs.

## Runtime & deployment notes
- `.env` holds both `EXPO_PUBLIC_*` (bundled/client-visible) and server/proxy vars (`URL_PROTOCOL`, `URL_HOST`, `URL_PORT`, `URL_PROXY_PROTOCOL`, `URL_PROXY_HOST`, `URL_PROXY_PORT`, `URL_BASE`, `URL_API`), Supabase credentials, Expo/EAS deploy auth and linkage (`EAS_TOKEN`, `EAS_PROJECT_ID`, `EAS_PROJECT_SLUG`), and deploy-push config (`GH_TOKEN`, `GH_REPO`).
- Supabase environment selection is enforced in `src/shared/supabase.js`: `EXPO_PUBLIC_SUPABASE_TARGET` defaults to `local` (local stack at `http://127.0.0.1:54321`), and only `npm run eas:deploy` overrides it to `hosted` (reading `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`). Never add a fallback between them, never bypass the override, and never expose a service-role key to the client.
- The local Supabase stack is private to the machine (API `54321`, PostgreSQL `54322`, Studio `54323`, Mailpit `54324`); never proxy or tunnel those ports.
- `opencode.json` declares the hosted Supabase MCP server; its URL uses `{env:SUPABASE_PROJECT_REF}` from `.env`. Do not hardcode the project reference. OpenCode must be launched via `npm run opencode` (which sources `.env`) for the substitution to resolve; authenticate once through `/mcps`.
- Several npm scripts source `.env` directly via `set -a && . ./.env && set +a`; `caddy` uses `--envfile`. Keep `.env` POSIX-compatible.
- `Dockerfile` + `docker-compose.yml` build/serve the static app only; they do not run PostgreSQL or Supabase. Local data is started separately with `npm run supabase:start` and is never part of the production image.
- `/api/health` returns `{status: "ok", timestamp, uptime}` with `Cache-Control: no-store`; the Docker healthcheck hits it.
- `.github/workflows/deploy.yml` runs on pushes to `main` (and manual dispatch): it restores `.env` from the `DOT_ENV` secret, installs dependencies, exports the web build on the runner, and uploads only the artifact to Expo Hosting via `npm run eas:deploy`.
- `build/`, `node_modules/`, and `.expo/` are generated/installed artifacts (gitignored). Edit source under `src/` and config at the repo root, not `build/`.

## Maintenance
- Whenever possible, update `README.md` and `CONTRIBUTING.md` to reflect relevant changes (behavior, config, conventions, workflows).
- Whenever possible, update `.*ignore*` files when new generated artifacts, local files, or build outputs should be excluded.
- Follow the commit rules in `CONTRIBUTING.md` (**Commits & PRs**): commit automatically as work completes, using the tagged types and message format defined there — but never push automatically; pushes are always explicit requests.
