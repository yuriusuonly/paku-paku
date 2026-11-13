# paku-paku

Paku paku (written in Japanese as ぱくぱく or パクパク) is a Japanese onomatopoeia that mimics the sound or action of a mouth repeatedly opening and closing.

Common Meanings & Uses:

- Eating heartily / gobbling up: Describing someone eating food quickly, eagerly, or bite after bite (e.g., paku paku taberu means to gobble something down).
- Mouth movement: Describing the motion of a mouth or jaw snapping open and shut, like a fish gasping for air.
- Pac-Man connection: The term inspired the name of the iconic video game character Pac-Man, coming from the phrase paku paku taberu.
- Origami: It is also the Japanese name for a paper fortune teller or chatterbox toy (pakupaku ningyo) that mimics a chomping mouth.

## Expo web app

An intentionally empty Expo web application: a minimal home screen plus the same
web/CI/runtime scaffold used by the sibling `yuriusuonly` workspace.

- **Stack:** Expo SDK 58 + Expo Router (web-only, static output, API routes),
  React 19, React Native Web, NativeWind v4, Tailwind CSS v3, plain JavaScript
  with JSDoc, and Supabase (local PostgreSQL for development and local builds,
  hosted Supabase on Expo Hosting).
- **Build:** `expo export --platform web` → `build/` (static export).
- **Deploy:** push to `main` triggers GitHub Actions, which exports the web
  build on the runner and uploads only the artifact to Expo Hosting (EAS).
- **Runtime:** `expo serve` locally or in Docker behind Caddy (`/api/health`
  healthcheck).

## Configuration

`.env` is the single source of truth for project configuration. It is
gitignored; CI restores it from the `DOT_ENV` repository secret.

| Key | Purpose |
| --- | --- |
| `EXPO_PUBLIC_TITLE` | App/site title (client-visible): Expo `name`, UI, document title, PWA manifest. |
| `EXPO_PUBLIC_DESCRIPTION` | App/site description (client-visible): UI, HTML meta description, PWA manifest. |
| `EXPO_PUBLIC_VERSION` | App version string (client-visible). |
| `URL_PROTOCOL` / `URL_HOST` / `URL_PORT` | Local dev and static server protocol/host/port (`3000` here). |
| `URL_PROXY_PROTOCOL` / `URL_PROXY_HOST` / `URL_PROXY_PORT` | Caddy TLS edge (`8443` here). |
| `URL_BASE` / `URL_API` | Project-level URL path values. |
| `EXPO_PUBLIC_SUPABASE_TARGET` | Supabase environment selector: `local` for development and local builds; `eas:deploy` overrides it to `hosted`. |
| `EXPO_PUBLIC_SUPABASE_LOCAL_URL` | Local Supabase API URL (`http://127.0.0.1:54321`); used whenever the target is not `hosted`. |
| `EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY` | Local Supabase anon key (`supabase status`); used whenever the target is not `hosted`. |
| `EXPO_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL; used only when the target is `hosted` (`eas:deploy`). |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Hosted Supabase anon key; used only when the target is `hosted` (`eas:deploy`). |
| `SUPABASE_DB_PASSWORD` | Hosted project database password for CLI migrations; never bundled into the app. |
| `EAS_TOKEN` | EAS access token (remapped to `EXPO_TOKEN` by the `eas:*` scripts). |
| `EAS_PROJECT_ID` | Expo Hosting project id printed by `npm run eas:initialize`. |
| `EAS_PROJECT_SLUG` | EAS project slug; must match the remote project. |
| `GH_REPO` | HTTPS repository URL used by the `github:*` scripts. |
| `GH_TOKEN` | GitHub token used by the `github:*` scripts. |

Keep `.env` POSIX-compatible (`KEY=value` lines): it is sourced by the Expo
scripts, loaded by Caddy's `--envfile`, and read by Node's `--env-file`.
`EXPO_PUBLIC_*` values are bundled into the client — never put secrets there.
Supabase anon/publishable keys are meant for browser use; service-role keys
must never appear in `.env` or in `EXPO_PUBLIC_*` values.

## Local development

```bash
npm ci
npm run expo:start        # dev server on $URL_PORT (loads .env)
npm run expo:start:tunnel # tunnel mode
```

## Supabase (local + hosted)

Development and local static builds use a local Supabase stack (PostgreSQL in
Docker) only. Only `npm run eas:deploy` sets
`EXPO_PUBLIC_SUPABASE_TARGET=hosted`, so the Expo Hosting build uses the hosted
project. There is no cross-environment fallback:
`src/shared/supabase.js` reads the `EXPO_PUBLIC_SUPABASE_LOCAL_*` values unless
the target is exactly `hosted`, in which case it reads
`EXPO_PUBLIC_SUPABASE_*`.

Prerequisite: a running Docker daemon your user can access (`docker ps`). If it
is denied, add your user to the `docker` group and start a new session.

```bash
npm run supabase:start    # PostgreSQL, Auth, REST, Studio, and friends
npm run supabase:status   # local URLs and keys (copy the anon key if it differs)
npm run supabase:reset    # re-apply migrations + seed
npm run supabase:check    # query menu_items through @supabase/supabase-js
npm run expo:start        # app on http://localhost:3000
npm run supabase:stop
```

Local endpoints are addressed over localhost; keep them private:

| Service | URL |
| --- | --- |
| API (REST/Auth) | `http://127.0.0.1:54321` |
| PostgreSQL | `127.0.0.1:54322` |
| Studio | `http://127.0.0.1:54323` |
| Mailpit | `http://127.0.0.1:54324` |

Do not expose these ports through Caddy, the public URL, or a tunnel.

Migrations live in `supabase/migrations/`; local seed data lives in
`supabase/seed.sql`. Add a migration with
`npm run supabase:migration -- <name>`, then verify it with
`npm run supabase:reset`.

To query the database from app code:

```js
import { getSupabase } from "../shared/supabase.js";

const { data, error } = await getSupabase()
  .from("menu_items")
  .select("*");
```

Hosted setup: create a Supabase project, copy its URL and anon key into
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and refresh the
`DOT_ENV` secret (`npm run github:secrets`) so production builds bake in the
hosted values. Apply local migrations to the hosted database with
`npm run supabase:login` (once), `npm run supabase:link -- <project-ref>`, and
`npm run supabase:push` (`SUPABASE_DB_PASSWORD` supplies the database password).

## Build & serve (static)

```bash
npm run expo:build  # exports to build/ (web, Metro), then copies the PNG icons to build/client/png/
npm run expo:serve  # serves build/ on $URL_PORT
```

`build/` is generated and gitignored — do not edit it by hand. Local static
builds keep the local Supabase target, so start the local stack before opening
`expo:serve`; only `npm run eas:deploy` switches the target to `hosted`.

## Local HTTPS (Caddy)

```bash
npm run caddy        # https://localhost:$URL_PROXY_PORT -> localhost:$URL_PORT
npm run caddy:trust  # trust Caddy's local CA (needed for service workers)
```

## Deployment (Expo Hosting)

One-time setup:

1. Put an EAS access token in `EAS_TOKEN` (expo.dev → Account settings → Access tokens).
2. Run `npm run eas:initialize` and paste the printed project id into
   `EAS_PROJECT_ID` in `.env`.
3. Create the GitHub repository, then run `npm run github:remote` and
   `npm run github:secrets` (stores `.env` as the `DOT_ENV` secret). The secret
   must contain the hosted Supabase values (`EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`); `eas:deploy` overrides the target to
   `hosted`, and production never uses the local URL.
4. Push to `main`; `.github/workflows/deploy.yml` runs `npm run eas:deploy`.

`eas:deploy` exports the web build locally (or on the runner) and uploads only
the finished `build/` artifact with `eas deploy --non-interactive --prod`;
EAS runs no builds. Use `npm run github:deploy` to refresh the `DOT_ENV` secret
and push the current branch.

## Docker

```bash
npm run docker:build
npm run docker:up
npm run docker:logs
npm run docker:down
```

Two services share one multi-stage image: `server` runs `expo serve` on
`$URL_PORT`, and `caddy` terminates HTTPS on `$URL_PROXY_PORT` and proxies to
`server`. The server healthcheck hits `/api/health`; Caddy waits for it to
become healthy. The compose stack serves only the static app: PostgreSQL and
Supabase are not part of it, and local data stays in the separate
`npm run supabase:start` stack.

## Routes & endpoints

| Route | Source | Purpose |
| --- | --- | --- |
| `/` | `src/app/index.js` → `src/screens/root.js` | Minimal starter screen. |
| 404 fallback | `src/app/+not-found.js` | Not-found screen. |
| document shell | `src/app/+html.js` | HTML metadata and PWA manifest link. |
| `/api/health` | `src/app/api/health+api.js` | JSON health probe used by Docker. |
| `/manifest.json` | `src/app/manifest.json+api.js` | PWA manifest with `any` and `maskable` icons. |
| `/robots.txt` | `src/app/robots.txt+api.js` | Allows all crawlers. |
| `/service-worker.js` | `src/app/service-worker.js+api.js` | Minimal service worker, registered on mount. |

## Project structure

```text
./
├── .github/
│   └── workflows/
│       └── deploy.yml
├── Caddyfile
├── Dockerfile
├── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
├── AGENTS.md
├── LICENSE.txt
├── eas.json
├── app.config.js
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── package.json
├── package-lock.json
├── .dockerignore
├── .env
├── .gitignore
├── png/
│   ├── logo.png
│   └── logo-maskable.png
├── svg/
│   ├── logo.svg
│   └── logo-maskable.svg
├── src/
│   ├── app/
│   │   ├── _layout.js
│   │   ├── +html.js
│   │   ├── +not-found.js
│   │   ├── index.js
│   │   ├── api/
│   │   │   └── health+api.js
│   │   ├── manifest.json+api.js
│   │   ├── robots.txt+api.js
│   │   └── service-worker.js+api.js
│   ├── screens/
│   │   └── root.js
│   ├── shared/
│   │   ├── config.js
│   │   └── supabase.js
│   └── stylesheets/
│       └── global.css
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20261113000000_create_menu_items.sql
│   └── seed.sql
└── ttf/
    └── Outfit-VariableFont_wght.ttf
```
