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
  with JSDoc.
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
| `URL_PROTOCOL` / `URL_HOST` / `URL_PORT` | Local dev and static server protocol/host/port (`3001` here). |
| `URL_PROXY_PROTOCOL` / `URL_PROXY_HOST` / `URL_PROXY_PORT` | Caddy TLS edge (`8444` here). |
| `URL_BASE` / `URL_API` | Project-level URL path values. |
| `EAS_TOKEN` | EAS access token (remapped to `EXPO_TOKEN` by the `eas:*` scripts). |
| `EAS_PROJECT_ID` | Expo Hosting project id printed by `npm run eas:initialize`. |
| `EAS_PROJECT_SLUG` | EAS project slug; must match the remote project. |
| `GH_REPO` | HTTPS repository URL used by the `github:*` scripts. |
| `GH_TOKEN` | GitHub token used by the `github:*` scripts. |

Keep `.env` POSIX-compatible (`KEY=value` lines): it is sourced by the Expo
scripts, loaded by Caddy's `--envfile`, and read by Node's `--env-file`.
`EXPO_PUBLIC_*` values are bundled into the client — never put secrets there.

## Local development

```bash
npm ci
npm run expo:start        # dev server on $URL_PORT (loads .env)
npm run expo:start:tunnel # tunnel mode
```

## Build & serve (static)

```bash
npm run expo:build  # exports to build/ (web, Metro)
npm run expo:serve  # serves build/ on $URL_PORT
```

`build/` is generated and gitignored — do not edit it by hand.

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
   `npm run github:secrets` (stores `.env` as the `DOT_ENV` secret).
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
become healthy.

## Routes & endpoints

| Route | Source | Purpose |
| --- | --- | --- |
| `/` | `src/app/index.js` → `src/screens/root.js` | Minimal starter screen. |
| 404 fallback | `src/app/+not-found.js` | Not-found screen. |
| document shell | `src/app/+html.js` | HTML metadata and PWA manifest link. |
| `/api/health` | `src/app/api/health+api.js` | JSON health probe used by Docker. |
| `/manifest.json` | `src/app/manifest.json+api.js` | PWA Web App Manifest. |
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
│   └── logo.png
├── svg/
│   └── logo.svg
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
│   │   └── config.js
│   └── stylesheets/
│       └── global.css
└── ttf/
    └── Outfit-VariableFont_wght.ttf
```
