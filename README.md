# paku-paku

[![Tests](https://img.shields.io/github/actions/workflow/status/yuriusuonly/paku-paku/ci.yaml?label=Tests&branch=main)](https://github.com/yuriusuonly/paku-paku/actions/workflows/ci.yaml)

Paku paku (written in Japanese as ぱくぱく or パクパク) is a Japanese onomatopoeia that mimics the sound or action of a mouth repeatedly opening and closing.

Common Meanings & Uses:

- Eating heartily / gobbling up: Describing someone eating food quickly, eagerly, or bite after bite (e.g., paku paku taberu means to gobble something down).
- Mouth movement: Describing the motion of a mouth or jaw snapping open and shut, like a fish gasping for air.
- Pac-Man connection: The term inspired the name of the iconic video game character Pac-Man, coming from the phrase paku paku taberu.
- Origami: It is also the Japanese name for a paper fortune teller or chatterbox toy (pakupaku ningyo) that mimics a chomping mouth.

## Expo web app

A web-only Expo Router application for a kiosk storefront: customers pick orders
from the menu, choose a payment method, and receive a counter QR code. Staff sign
in to take orders and review order logs; administrators manage analytics, audit
logs, and edits. Backed by Supabase and packaged for local development, Docker,
and Expo Hosting.

- **Stack:** Expo SDK 58 + Expo Router (web-only, static output, API routes),
  React 19, React Native Web, NativeWind v4, Tailwind CSS v3, Zustand, Zod for
  request validation, plain JavaScript with JSDoc, and Supabase (local PostgreSQL
  for development and local builds, hosted Supabase on Expo Hosting).
- **Build:** `expo export --platform web` → `build/` (static export).
- **Deploy:** push to `main` triggers GitHub Actions, which pushes hosted Supabase migrations, exports the web
  build on the runner, and uploads only the artifact to Expo Hosting (EAS).
- **Runtime:** Bun runs the toolchain, scripts, tests and containers; `expo serve`
  runs locally or in Docker behind Caddy (`/api/health` healthcheck).
- **Architecture:** layered modular monolith with thin routes, endpoint use-case
  composition, repositories, and a pure domain layer for business rules/schemas
  (see `CONTRIBUTING.md` → Architecture).

## Configuration

`.env` is the single source of truth for project configuration. It is
gitignored; CI restores it from the `DOT_ENV` repository secret.

| Key | Purpose |
| --- | --- |
| `EXPO_PUBLIC_TITLE` | App/site title (client-visible): Expo `name`, UI, document title, PWA manifest. |
| `EXPO_PUBLIC_DESCRIPTION` | Kiosk storefront description (client-visible): landing page, HTML meta description, PWA manifest. |
| `EXPO_PUBLIC_VERSION` | App version string (client-visible). |
| `EXPO_PUBLIC_CURRENCY_CODE` | Currency code (client-visible, e.g. `PHP`); available via `currency` in `constants/config.js`. |
| `EXPO_PUBLIC_CURRENCY_SYMBOL` | Currency symbol (client-visible, e.g. `₱`); available via `currency` in `constants/config.js`. |
| `EXPO_PUBLIC_GUEST_EMAIL` / `EXPO_PUBLIC_GUEST_PASSWORD` | Shared public customer credentials used by "Continue as guest" on `/signin`; no signup exists. |
| `URL_PROTOCOL` / `URL_HOST` / `URL_PORT` | Local dev and static server protocol/host/port (`3000` here). |
| `URL_PROXY_PROTOCOL` / `URL_PROXY_HOST` / `URL_PROXY_PORT` | Caddy TLS edge (`8443` here). |
| `URL_BASE` | Project-level base URL path. |
| `EXPO_PUBLIC_URL_API_BASE_PATH` | Client-visible API base path without a leading slash (e.g. `api`); `constants/config.js` adds the slash when composing endpoint URLs. |
| `EXPO_PUBLIC_SUPABASE_TARGET` | Supabase environment selector: `local` for development and local builds; the `--hosted` export flag (used by `eas:deploy`) and the deploy script override it to `hosted`. |
| `EXPO_PUBLIC_SUPABASE_LOCAL_URL` | Local Supabase API URL (`http://127.0.0.1:54321`); used whenever the target is not `hosted`. |
| `EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY` | Local Supabase anon key (`supabase status`); used whenever the target is not `hosted`. |
| `EXPO_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL; used only when the target is `hosted` (hosted export). |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Hosted Supabase anon key; used only when the target is `hosted` (hosted export). |
| `SUPABASE_LOCAL_SERVER_URL` | Local Supabase API URL used by Dockerized server routes (`http://api.supabase.internal:8000`, Kong on the Supabase Docker network). |
| `SUPABASE_PROJECT_REF` | Hosted project reference; used by `bun run supabase:link` and the OpenCode Supabase MCP server in `opencode.json`. |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token for non-interactive CLI auth (linking/pushing hosted migrations, e.g. in CI); never bundled into the app. |
| `EXPO_TOKEN` | Expo/EAS access token used by the `eas:*` scripts and `eas-cli`. |
| `EAS_PROJECT_ID` | Expo Hosting project id printed by `bun run eas:initialize`. |
| `EAS_PROJECT_SLUG` | EAS project slug; must match the remote project. |
| `GITHUB_REPOSITORY` | HTTPS repository URL used by the `gh:*` scripts. |
| `GITHUB_TOKEN` | GitHub token used by the `gh:*` scripts. |

Refresh `DOT_ENV` after changing `EXPO_PUBLIC_DESCRIPTION` or the shared guest credentials so hosted static builds pick up the new copy and sign-in values.

Keep `.env` POSIX-compatible (`KEY=value` lines): every launcher parses it
through `system/environment.js`, Compose interpolates it for ports/build args,
and Caddy receives it via the process environment.
`EXPO_PUBLIC_*` values are bundled into the client — never put secrets there.
Supabase anon/publishable keys are meant for browser use; service-role keys
must never appear in `.env` or in `EXPO_PUBLIC_*` values.

## Local development

```bash
bun install
bun run expo:start        # dev server on $URL_PORT (loads .env)
bun run expo:start:tunnel # tunnel mode
```

## Supabase (local + hosted)

Development and local static builds use a local Supabase stack (PostgreSQL in
Docker) only. Only the hosted export (`bun run eas:deploy`, which passes `--hosted` to
`scripts/expo.js`) sets `EXPO_PUBLIC_SUPABASE_TARGET=hosted`, so the Expo
Hosting bundle uses the hosted project. There is no cross-environment fallback:
`database/instance.js` reads the `EXPO_PUBLIC_SUPABASE_LOCAL_*` values unless
the target is exactly `hosted`, in which case it reads
`EXPO_PUBLIC_SUPABASE_*`.

Prerequisite: a running Docker daemon your user can access (`docker ps`). If it
is denied, add your user to the `docker` group and start a new session.

```bash
bun run supabase:start    # PostgreSQL, Auth, REST, Studio, and friends
bun run supabase:status   # local URLs and keys (copy the anon key if it differs)
bun run supabase:reset    # re-apply migrations + seed
bun run expo:start        # app on http://localhost:3000
bun run supabase:stop
```

`supabase:reset` reapplies migrations and seeds the sample items plus three
accounts: `admin@paku-paku.official` (password `admin`, `admin` role),
`staff@paku-paku.official` (password `staff`, `staff` role), and the single
shared `guest@paku-paku.official` (password `guest`, `customer` role). There is
no signup; storefront visitors use "Continue as guest". Administrators can
access `/admin/*` only, staff `/staff/*` only, and customers `/menu`, `/cart`,
and `/checkout` only. Seeded accounts use internal Supabase Auth emails.
The seed stores static bcrypt hashes so it does not depend on `pgcrypto`;
rerunning the seed restores the local passwords. The local auth config keeps
`minimum_password_length = 6`, so GoTrue may report the short seed
passwords as weak while still accepting them. |

Local endpoints are addressed over localhost; keep them private:

| Service | URL |
| --- | --- |
| API (REST/Auth) | `http://127.0.0.1:54321` |
| PostgreSQL | `127.0.0.1:54322` |
| Studio | `http://127.0.0.1:54323` |
| Mailpit | `http://127.0.0.1:54324` |

Do not expose these ports through Caddy, the public URL, or a tunnel.

Migrations live in `supabase/migrations/`; local seed data lives in
`supabase/seeds/`. Add a migration with
`bun run supabase:migration -- <name>`, then verify it with
`bun run supabase:reset`.

Server API routes in `app/api/` select Supabase at runtime with
`database/instance.js` (local stack vs hosted project, no fallback).
Browser and server code use `getSupabase()`, `getSupabaseServerConfig()`, and `createSupabaseServerClient()` from `database/instance.js`.

```js
import { getSupabase } from "../database/instance.js";

const { data, error } = await getSupabase()
  .from("items")
  .select("*");
```

Hosted setup: create a Supabase project, copy its URL and anon key into
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and refresh the
`DOT_ENV` secret (`bun run gh:secrets`) so production builds bake in the
hosted values. `bun run eas:deploy` refuses to run without those hosted values.
Apply local migrations to the hosted database with `bun x --bun supabase login`
(once), `bun run supabase:link` (reads `SUPABASE_PROJECT_REF` from `.env`), and
`bun run supabase:push` (`SUPABASE_ACCESS_TOKEN` authenticates the Supabase CLI).

OpenCode connects to the hosted Supabase, Expo, GitHub, and official Figma MCP
servers declared in `opencode.json`; the GitHub one authenticates with
`GITHUB_TOKEN`, while Figma uses OpenCode's OAuth flow (no token in `.env`).
The official local Playwright MCP (`@playwright/mcp`) is also configured but
not used yet; E2E tests run through the `playwright` scripts instead.
Launch OpenCode with `bun run opencode` (so `.env` is loaded) and authenticate
via `/mcps` if a server reports that it needs authentication.

## Build & serve (static)

```bash
bun run expo:build  # exports to build/ (web, Metro), then copies the PNG icons to build/client/png/
bun run expo:serve  # serves build/ on $URL_PORT
```

## Automated tests

```bash
bun run bun:test        # Bun tests under test/, mirroring root modules
bun run playwright      # Playwright CLI (e.g. `bun run playwright -- install chromium`)
bun run playwright:test # E2E specs in test/app/*.e2e.js
```

- Test files mirror workspace root modules (for example `test/domain/items/schema.test.js` covers `domain/items/schema.js`). CI gates on 95% overall coverage. Playwright specs use `*.e2e.js` under `test/app/` so Bun's runner ignores them; they drive real app flows and assert reactive behavior, not whole rendered pages. E2E runs over HTTPS through the Caddy proxy on `$URL_PROXY_PORT`; the config starts both the dev server and Caddy. Playwright artifacts go to the system temp directory, never into the workspace.
- Docker-based test runs are defined in `docker-compose.yml` (single source of truth): `docker compose --profile test run --rm test-unit` (Bun, `oven/bun:1.4.5-alpine`).

`build/` is generated and gitignored — do not edit it by hand. Local static
builds keep the local Supabase target, so start the local stack before opening
`expo:serve`; only a hosted export (`bun run eas:deploy`) switches the target to `hosted`.

## Local HTTPS (Caddy)

```bash
bun run caddy        # https://localhost:$URL_PROXY_PORT -> localhost:$URL_PORT
bun run caddy:trust  # trust Caddy's local CA (needed for service workers)
```

Caddy sets HSTS, `X-Content-Type-Options`, `Referrer-Policy` and
`X-Frame-Options` on every response.

## Deployment (Expo Hosting)

One-time setup:

1. Put an Expo/EAS access token in `EXPO_TOKEN` (expo.dev → Account settings → Access tokens).
2. Run `bun run eas:initialize` and paste the printed project id into
   `EAS_PROJECT_ID` in `.env`.
3. Create the GitHub repository, then run `bun run gh:remote` and
   `bun run gh:secrets` (stores `.env` as the `DOT_ENV` secret). The secret
   must contain the hosted Supabase values (`EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`); `eas:deploy` builds with `--hosted` and overrides the target to
   `hosted`, and production never uses the local URL.
4. Push to `main`; `.github/workflows/ci.yaml` runs `bun:test` and `playwright:test`, while `deploy-expo.yml` runs `bun run eas:deploy` and `deploy-supabase.yml` links and pushes migrations.

`eas:deploy` requires hosted Supabase URL/anon key, exports the web build
with `--hosted` locally (or on the runner), and uploads the finished `build/` artifact with
`eas deploy --non-interactive --prod --environment production`; EAS runs no
builds. The `--environment production` flag makes EAS production environment
variables available to server-side API routes. Use `bun run gh:deploy` to
refresh the `DOT_ENV` secret and push the current branch.

## Docker (all-in-one compose)

`Dockerfile` and `docker-compose.yml` are the single source of truth for containerized build, local run, and test workflows.

```bash
bun run docker:build  # build app image (profile: app)
bun run docker:up     # start server + caddy (profile: app)
bun run docker:logs   # follow app logs
bun run docker:down   # stop/remove app/build/test services

# one-shot containerized build/tests (via docker-compose.yml)
docker compose --profile build run --rm build
docker compose --profile test run --rm test-unit
```

- **Local run (`app`)**: `server` runs `bun ./scripts/expo.js serve build` (the launcher appends `--port` from `URL_PORT`) and `caddy` terminates HTTPS on `$URL_PROXY_PORT` (healthcheck: `/api/health`). For local Supabase-backed routes, start `bun run supabase:start` first; the app joins external network `${SUPABASE_DOCKER_NETWORK:-supabase_network_paku-paku}` to reach Kong at `http://api.supabase.internal:8000`.
- **Build (`build`)**: one-shot container installs with Bun and exports the static web app into `./build`.
- **Tests (`test`)**: `test-unit` runs Bun tests in `oven/bun:1.4.5-alpine`.

## Routes & endpoints

Only `/` and `/signin` are public pages. Everything else requires one of the
three seeded roles:

- **Customer:** `/menu`, `/cart`, and `/checkout` (order confirmation with the counter QR). Customers sign in with the shared guest profile; no signup. A main dish plus any side drink gets ₱10 off automatically.
- **Staff:** `/staff/order` (one form for manual entry or optional QR/order-number lookup that fills items, customer, notes, and prices; shows a confirmation snackbar and clears the form on success) and `/staff/records` (order logs with status updates). Staff cannot access `/admin/*`.
- **Admin:** dashboard analytics, audit logs, and edit screens for items, orders, and profiles, including the profiles audit page that lists every seeded account. Administrators cannot access `/staff/*`.

| Route | Source | Purpose |
| --- | --- | --- |
| `/` | `app/index.js` → `screens/root.js` | Storefront landing with a link to the menu. |
| `/menu` | `app/(customer)/menu.js` → `screens/menu/menu.screen.js` | Customer menu with add-to-cart controls. |
| `/cart` | `app/(customer)/cart.js` → `screens/cart/cart.screen.js` | Customer cart: payment selection and order placement. |
| `/checkout` | `app/(customer)/checkout.js` → `screens/checkout/checkout.screen.js` | Confirmation and counter QR after placement; save the QR as a PNG image. |
| `/signin` | `app/signin.js` → `screens/signin/signin.screen.js` | Public sign-in: "Continue as guest" or staff/admin credentials; redirects by role. |
| `/staff` | `app/(staff)/staff/index.js` | Protected staff area; redirects to `/staff/order`. |
| `/staff/order` | `app/(staff)/staff/order.js` → `screens/staff/order-taking/order-taking.screen.js` | Unified order form with optional QR/order-number lookup (camera scanning or QR image upload via jsQR, manual entry fallback); shows a confirmation snackbar and clears the form after success (staff role only). |
| `/staff/records` | `app/(staff)/staff/records.js` → `screens/staff/logs/logs.screen.js` | Order logs and status updates (staff role only). |
| `/admin` | `app/(admin)/admin/index.js` → `screens/admin/admin.screen.js` | Admin dashboard (protected). |
| `/admin/items` | `app/(admin)/admin/items.js` → `screens/admin/items/items.screen.js` | Admin menu management (protected). |
| `/admin/orders` | `app/(admin)/admin/orders.js` → `screens/admin/orders/orders.screen.js` | Admin order audit (protected). |
| `/admin/profiles` | `app/(admin)/admin/profiles.js` → `screens/admin/profiles/profiles.screen.js` | Read-only profile audit (protected). |
| `/admin/audit-logs` | `app/(admin)/admin/audit-logs.js` → `screens/admin/audit-logs/audit-logs.screen.js` | Admin audit trail (protected). |
| 404 fallback | `app/+not-found.js` | Not-found screen. |
| document shell | `app/+html.js` | HTML metadata and PWA manifest link. |
| `/api/health` | `app/api/health+api.js` | JSON health probe used by Docker. |
| `/api/items` | `app/api/items/+api.js` | Public menu listing (`GET`); admin create (`POST`). |
| `/api/items/[id]` | `app/api/items/[id]+api.js` | Admin item update/delete (`PATCH`/`DELETE`). |
| `/api/checkout` | `app/api/checkout+api.js` | Customer checkout (`POST`), returns order + counter QR; requires guest token. |
| `/api/signin` | `app/api/signin+api.js` | Sign-in for guest, staff, and admin profiles. |
| `/api/session` | `app/api/session+api.js` | Validates bearer token and returns the current profile. |
| `/api/signout` | `app/api/signout+api.js` | Revokes the current session. |
| `/api/admin/orders` | `app/api/admin/orders/+api.js` | Admin orders listing and create (`GET`/`POST`). |
| `/api/admin/orders/[id]` | `app/api/admin/orders/[id]+api.js` | Admin order read/update/delete (`GET`/`PATCH`/`DELETE`). |
| `/api/admin/profiles` | `app/api/admin/profiles+api.js` | Read-only admin profile listing (`GET`) and status update (`PATCH`). |
| `/api/admin/audit-logs` | `app/api/admin/audit-logs/+api.js` | Admin audit trail listing (`GET`). |
| `/api/staff/orders` | `app/api/staff/orders/+api.js` | Staff order logs and manual order taking (`GET`/`POST`). |
| `/api/staff/orders/verify` | `app/api/staff/orders/verify+api.js` | Staff order verification (`POST`). |
| `/api/staff/orders/[id]` | `app/api/staff/orders/[id]+api.js` | Staff order status update (`PATCH`). |
| `/manifest.json` | `app/manifest.json+api.js` | PWA manifest with `any` and `maskable` icons. |
| `/robots.txt` | `app/robots.txt+api.js` | Allows all crawlers. |
| `/service-worker.js` | `app/service-worker.js+api.js` | Minimal service worker, registered on mount. |

## Project structure

```text
./
├── .agents/                        # installed skills → GitHub, Figma, Expo, Playwright
│   └── skills/
├── .expo/                          # generated Expo cache
├── .figma/                         # Figma design reference and screenshots
├── .github/                        # CI tests + deploys → workflows/
│   └── workflows/
├── app/                            # Expo Router pages → screens/ ; api/ → endpoints/
│   ├── (admin)/                    # auth-guarded admin routes
│   ├── (customer)/                 # guest-role customer routes
│   ├── (staff)/                    # staff-role routes
│   └── api/                        # thin HTTP wrappers → endpoints/
├── build/                          # generated static export
├── cipher/                         # leaf encoding/hashing/token utilities
├── components/                     # ← screens/ ; theme tokens ← constants/
├── constants/                      # leaf config → app/, database/, services/, screens/
├── database/                       # ← repositories/ ; config ← constants/
├── domain/                         # pure rules ← endpoints/, repositories/, screens/
├── endpoints/                      # → interceptors/ → repositories/ → database/
├── errors/                         # typed errors ← repositories/, endpoints/, services/
├── format/                         # leaf currency/date/email helpers
├── helpers/                        # leaf list/record/QR helpers
├── interceptors/                   # between endpoints/ and repositories/
├── network/                        # middleware ← endpoints/ ; transport ← services/
├── node_modules/                   # generated Bun dependencies
├── png/                            # static icons for the app/ shell
├── repositories/                   # → database/ and domain/ ; ← endpoints/
├── screens/                        # → components/, stores/, services/ ; ← app/
├── scripts/                        # bun run launchers → system/ wrappers
├── services/                       # → HTTP /api/* ; ← stores/
├── stores/                         # Zustand state → services/ ; ← screens/
├── stylesheets/                    # global.css ← metro.config.js
├── supabase/                       # schema and seeds → database/
│   ├── migrations/                 # one migration per table
│   ├── seeds/                      # admin, staff, guest and menu items
│   └── config.toml                 # local ports and auth config
├── svg/                            # icon sources → png/
├── system/                         # ← scripts/ ; wraps node:* built-ins
├── test/                           # mirrors root modules ; app/*.e2e.js → playwright
│   ├── app/                        # E2E flows against app/ routes
│   ├── cipher/                     # cipher/ tests
│   ├── domain/                     # domain/ tests
│   ├── endpoints/                  # endpoints/ tests
│   ├── format/                     # format/ tests
│   ├── helpers/                    # helpers/ tests
│   ├── network/                    # network/ tests
│   ├── services/                   # services/ tests
│   ├── stores/                     # stores/ tests
│   ├── system/                     # system/ tests
│   └── validation/                 # validation/ tests
├── ttf/                            # Outfit font ← constants/theme.js
├── validation/                     # leaf Zod/request validators
├── .dockerignore
├── .env                            # gitignored config source for every launcher
├── .gitignore
├── AGENTS.md                       # agent instructions
├── CONTRIBUTING.md                 # conventions and guides
├── Caddyfile                       # HTTPS proxy → $URL_PORT (dev server)
├── DESIGN.md                       # visual tokens ← constants/theme.js
├── Dockerfile                      # Bun 1.4.5 export/runtime image
├── LICENSE.txt
├── README.md
├── app.config.js                   # Expo config ← .env
├── babel.config.js
├── bun.lock
├── bunfig.toml                     # test root → test/
├── docker-compose.yml
├── eas.json
├── metro.config.js                 # bundles stylesheets/global.css
├── opencode.json                   # instructions + MCP servers
├── package.json                    # scripts → scripts/*
├── playwright.config.js            # Caddy HTTPS + test/app/*.e2e.js
├── skills-lock.json
└── tailwind.config.js              # scans root-level app directories
```
