# Contributing

## Prerequisites
- Node.js/npm (Docker image uses Node 22)
- Docker + Compose for containerized runs
- `eas-cli` is invoked on demand via `npx` by the `eas:*` scripts; `gh` (GitHub CLI) is used by the `github:*` scripts (authenticated via `GH_TOKEN` in `.env`); Caddy is bundled in the Docker runtime, so use a local Caddy install for local Caddy commands

## Setup
1. `npm ci`
2. Ensure `.env` exists and is **POSIX-compatible** (simple `KEY=value` lines): the Expo scripts source it, Caddy loads it with `--envfile`, and Node tooling can read it with `--env-file`.
3. **`.env` is the single source of truth for project configuration.** Do not add fallback/default values elsewhere; all required configuration must be defined in `.env`.

## Development workflow
- The app is **web-only** (Expo Router, Metro, static web output with API routes). Do not assume native platforms are configured.
- Edit source in `src/` and root config (`app.config.js`, `metro.config.js`, `tailwind.config.js`, etc.). Do not edit generated artifacts in `build/` or `node_modules/`.
- Dev server: `npm run expo:start`. Tunnel: `npm run expo:start:tunnel`.
- Add convenience/repeatable project commands as scripts in `package.json`; do not create a `scripts/` directory for them. Treat `package.json` scripts as the single source of truth for how to run and configure the project.
- Keep dependencies limited to what is actually imported/used. `devDependencies` holds workspace-local tooling that is not imported by the app.

## Guides

### Project structure (tree)

Show the canonical up-to-date tree from `README.md` → **Project structure**.

### Diagrams & flowcharts (Mermaid)

Use **Mermaid** for diagrams/flowcharts in docs. Example: build & deploy pipeline:

```mermaid
flowchart TD
  A["npm run expo:build (expo export --platform web)"] --> B["build/"]
  B --> C{"Deploy target"}
  C -->|"Local"| D["npm run expo:serve (:URL_PORT) behind Caddy"]
  C -->|"Docker"| E["docker:build (Dockerfile)"]
  E --> F["Container runs expo serve + Caddy"]
  C -->|"GitHub Actions"| G["npm run eas:deploy"]
  G --> H["Expo Hosting (artifact upload only)"]
```

## Routing & API conventions (Expo Router)
- File-based routes live in `src/app/`.
- API/special web routes use `+api` suffix naming, e.g. `api/health+api.js` → `/api/health`, `robots.txt+api.js`, `manifest.json+api.js`, `service-worker.js+api.js`. Handlers receive web `Request` and return `Response`.
- Root layout is `src/app/_layout.js`; custom document shell is `src/app/+html.js`.

### Adding a page/route
1. Create `src/app/<route>.js` and `export default` the screen component (React Native Web primitives with NativeWind `className`), keeping the screen itself under `src/screens/` when it grows.
2. Add the route to the **Routes & endpoints** table in `README.md`.

### Adding an API route
1. Create `src/app/<path>+api.js` with `export function GET()` (and other HTTP verbs when needed), receiving a web `Request` and returning a `Response`.
2. Set a correct `Content-Type` and sensible cache semantics.
3. Add the endpoint to the **Routes & endpoints** table in `README.md`.

## Styling & config
- Use NativeWind/Tailwind classes (`className`) with React Native Web primitives. Global CSS is `src/stylesheets/global.css`.
- Tailwind content scans `src/**/*.{js,jsx,ts,tsx}`; dark mode is `class`-based.
- Client-visible config comes from `EXPO_PUBLIC_*` vars (see `src/shared/config.js`, `app.config.js`). Keep secrets out of `EXPO_PUBLIC_*`.

## Documentation conventions
- Always include JSDoc for modules with a top-level `@module` tag.
- Always add JSDoc for top-level exported functions and variables.
- Never include the `@example` tag in JSDoc.

## Verification
- No lint/test/typecheck scripts are configured. Manually verify changes with `npm run expo:build` (and `npm run expo:start`), and `npm run docker:build` if touching container/runtime config.
- `/api/health` should return `{ status: "ok", timestamp, uptime }` with `Cache-Control: no-store`.

## Documentation maintenance
- Keep `README.md` and `CONTRIBUTING.md` in sync with relevant changes (behavior, config, conventions, workflows).
- Document structure in tree form and use **Mermaid** for diagrams.

## Commits & PRs
- Commit messages use one of these tagged types:
  - `(feature)` — newly added feature
  - `(chore)` — documentation/configuration maintenance
  - `(ui)` — UI/UX changes
  - `(fix)` — bug and hot fixes
  - `(refactor)` — optimizations and code quality
- Format: a one-line short descriptive title after the tag, followed by a multi-line bulleted list of the individual changes.
- Commit automatically as work completes, without waiting for an explicit commit request. **Never push automatically** — pushing is always a deliberate action; deploys run through the push-to-deploy workflow (see `README.md` → Deployment).
