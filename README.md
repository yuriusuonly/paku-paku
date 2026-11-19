# paku-paku

Paku paku (written in Japanese as ぱくぱく or パクパク) is a Japanese onomatopoeia that mimics the sound or action of a mouth repeatedly opening and closing.

Common Meanings & Uses:

- Eating heartily / gobbling up: Describing someone eating food quickly, eagerly, or bite after bite (e.g., paku paku taberu means to gobble something down).
- Mouth movement: Describing the motion of a mouth or jaw snapping open and shut, like a fish gasping for air.
- Pac-Man connection: The term inspired the name of the iconic video game character Pac-Man, coming from the phrase paku paku taberu.
- Origami: It is also the Japanese name for a paper fortune teller or chatterbox toy (pakupaku ningyo) that mimics a chomping mouth.

## Expo web app

A web-only Expo Router application for a kiosk storefront: customers pick orders
from the menu, choose a payment method, and receive a counter QR code. Staff sign
in to manage items and audit orders. Backed by Supabase and packaged
for local development, Docker, and Expo Hosting.

- **Stack:** Expo SDK 58 + Expo Router (web-only, static output, API routes),
  React 19, React Native Web, NativeWind v4, Tailwind CSS v3, Zustand, Zod for
  request validation, plain JavaScript with JSDoc, and Supabase (local PostgreSQL
  for development and local builds, hosted Supabase on Expo Hosting).
- **Build:** `expo export --platform web` → `build/` (static export).
- **Deploy:** push to `main` triggers GitHub Actions, which pushes hosted Supabase migrations, exports the web
  build on the runner, and uploads only the artifact to Expo Hosting (EAS).
- **Runtime:** `expo serve` locally or in Docker behind Caddy (`/api/health`
  healthcheck).
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
| `EXPO_PUBLIC_CURRENCY_CODE` | Currency code (client-visible, e.g. `PHP`); available via `currency` in `src/shared/constants/config.js`. |
| `EXPO_PUBLIC_CURRENCY_SYMBOL` | Currency symbol (client-visible, e.g. `₱`); available via `currency` in `src/shared/constants/config.js`. |
| `URL_PROTOCOL` / `URL_HOST` / `URL_PORT` | Local dev and static server protocol/host/port (`3000` here). |
| `URL_PROXY_PROTOCOL` / `URL_PROXY_HOST` / `URL_PROXY_PORT` | Caddy TLS edge (`8443` here). |
| `URL_BASE` | Project-level base URL path. |
| `EXPO_PUBLIC_URL_API_BASE_PATH` | Client-visible API base path (e.g. `/api`); composed into API endpoint config in `src/shared/constants/config.js`. |
| `EXPO_PUBLIC_SUPABASE_TARGET` | Supabase environment selector: `local` for development and local builds; `eas:deploy` overrides it to `hosted`. |
| `EXPO_PUBLIC_SUPABASE_LOCAL_URL` | Local Supabase API URL (`http://127.0.0.1:54321`); used whenever the target is not `hosted`. |
| `EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY` | Local Supabase anon key (`supabase status`); used whenever the target is not `hosted`. |
| `EXPO_PUBLIC_SUPABASE_URL` | Hosted Supabase project URL; used only when the target is `hosted` (`eas:deploy`). |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Hosted Supabase anon key; used only when the target is `hosted` (`eas:deploy`). |
| `SUPABASE_LOCAL_SERVER_URL` | Local Supabase API URL used by Dockerized server routes (`http://api.supabase.internal:8000`, Kong on the Supabase Docker network). |
| `SUPABASE_PROJECT_REF` | Hosted project reference; used by `npm run supabase:link` and the OpenCode Supabase MCP server in `opencode.json`. |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token for non-interactive CLI auth (linking/pushing hosted migrations, e.g. in CI); never bundled into the app. |
| `EXPO_TOKEN` | Expo/EAS access token used by the `eas:*` scripts and `eas-cli`. |
| `EAS_PROJECT_ID` | Expo Hosting project id printed by `npm run eas:initialize`. |
| `EAS_PROJECT_SLUG` | EAS project slug; must match the remote project. |
| `GH_REPO` | HTTPS repository URL used by the `github:*` scripts. |
| `GH_TOKEN` | GitHub token used by the `github:*` scripts. |

Refresh `DOT_ENV` after changing `EXPO_PUBLIC_DESCRIPTION` so hosted static builds pick up the new kiosk copy.

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
`src/database/instance.js` reads the `EXPO_PUBLIC_SUPABASE_LOCAL_*` values unless
the target is exactly `hosted`, in which case it reads
`EXPO_PUBLIC_SUPABASE_*`.

Prerequisite: a running Docker daemon your user can access (`docker ps`). If it
is denied, add your user to the `docker` group and start a new session.

```bash
npm run supabase:start    # PostgreSQL, Auth, REST, Studio, and friends
npm run supabase:status   # local URLs and keys (copy the anon key if it differs)
npm run supabase:reset    # re-apply migrations + seed
npm run expo:start        # app on http://localhost:3000
npm run supabase:stop
```

`supabase:reset` reapplies migrations and seeds the sample items plus two staff
accounts: `admin@paku-paku.official` (password `admin`) and
`staff@paku-paku.official` (password `staff`). Both use the `admin` role.
Authentication is email/password; seeded staff use internal Supabase Auth emails.
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
`npm run supabase:migration -- <name>`, then verify it with
`npm run supabase:reset`.

Server API routes in `src/app/api/` select Supabase at runtime with
`src/database/instance.js` (local stack vs hosted project, no fallback).
Browser and server code use `getSupabase()`, `getSupabaseServerConfig()`, and `createSupabaseServerClient()` from `src/database/instance.js`.

```js
import { getSupabase } from "../database/instance.js";

const { data, error } = await getSupabase()
  .from("items")
  .select("*");
```

Hosted setup: create a Supabase project, copy its URL and anon key into
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and refresh the
`DOT_ENV` secret (`npm run github:secrets`) so production builds bake in the
hosted values. `npm run eas:deploy` refuses to run without those hosted values.
Apply local migrations to the hosted database with `npx --yes supabase login`
(once), `npm run supabase:link` (reads `SUPABASE_PROJECT_REF` from `.env`), and
`npm run supabase:push` (`SUPABASE_ACCESS_TOKEN` authenticates the Supabase CLI). |

OpenCode connects to the hosted Supabase MCP server declared in `opencode.json`.
Its URL resolves `SUPABASE_PROJECT_REF` from `.env`, so the project reference is
never duplicated in configuration. Launch OpenCode with `npm run opencode` (so
`.env` is loaded) and authenticate via `/mcps` if the server reports that it
needs authentication.

## Build & serve (static)

```bash
npm run expo:build  # exports to build/ (web, Metro), then copies the PNG icons to build/client/png/
npm run expo:serve  # serves build/ on $URL_PORT
```

## Automated tests

```bash
npm test  # unit + integration/mock tests (bun)
```

- `npm test` runs Bun tests under `test/` (unit, integration, and service/mock coverage).
- Docker-based test runs are defined in `docker-compose.yml` (single source of truth): `set -a && . ./.env && set +a && docker compose --profile test run --rm test-unit` (Bun, `oven/bun:1`).

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

1. Put an Expo/EAS access token in `EXPO_TOKEN` (expo.dev → Account settings → Access tokens).
2. Run `npm run eas:initialize` and paste the printed project id into
   `EAS_PROJECT_ID` in `.env`.
3. Create the GitHub repository, then run `npm run github:remote` and
   `npm run github:secrets` (stores `.env` as the `DOT_ENV` secret). The secret
   must contain the hosted Supabase values (`EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`); `eas:deploy` overrides the target to
   `hosted`, and production never uses the local URL.
4. Push to `main`; `.github/workflows/deploy.yml` runs `npm run eas:deploy`.

`eas:deploy` requires hosted Supabase URL/anon key, exports the web build
locally (or on the runner), and uploads the finished `build/` artifact with
`eas deploy --non-interactive --prod --environment production`; EAS runs no
builds. The `--environment production` flag makes EAS production environment
variables available to server-side API routes. Use `npm run github:deploy` to
refresh the `DOT_ENV` secret and push the current branch.

## Docker (all-in-one compose)

`Dockerfile` and `docker-compose.yml` are the single source of truth for containerized build, local run, and test workflows.

```bash
npm run docker:build  # build app image (profile: app)
npm run docker:up     # start server + caddy (profile: app)
npm run docker:logs   # follow app logs
npm run docker:down   # stop/remove app/build/test services

# one-shot containerized build/tests (via docker-compose.yml)
set -a && . ./.env && set +a && docker compose --profile build run --rm build
set -a && . ./.env && set +a && docker compose --profile test run --rm test-unit
```

- **Local run (`app`)**: `server` runs `expo serve` on `$URL_PORT` and `caddy` terminates HTTPS on `$URL_PROXY_PORT` (healthcheck: `/api/health`). For local Supabase-backed routes, start `npm run supabase:start` first; the app joins external network `${SUPABASE_DOCKER_NETWORK:-supabase_network_paku-paku}` to reach Kong at `http://api.supabase.internal:8000`.
- **Build (`build`)**: one-shot container exports the static web app into `./build`.
- **Tests (`test`)**: `test-unit` runs Bun tests in `oven/bun:1`.

## Routes & endpoints

The app has three areas:

- **Customer storefront:** `/`, `/menu`, and `/cart`; no account required. Customers can buy items individually or get ₱10 off automatically when a main dish and any side drink are in the same order. Checkout creates a counter QR with order details.
- **Staff counter:** `/staff`; authenticated staff scan/enter the QR payload, verify the order, and complete it as Paid/Refunded/Voided.
- **Admin audit:** `/admin`; protected dashboard plus items, orders, profiles, and audit logs.

| Route | Source | Purpose |
| --- | --- | --- |
| `/` | `src/app/index.js` → `src/screens/root.js` | Storefront landing with a link to the menu. |
| `/menu` | `src/app/menu.js` → `src/screens/menu/menu.screen.js` | Public menu with add-to-cart controls. |
| `/cart` | `src/app/cart.js` → `src/screens/cart/cart.screen.js` | Public checkout: payment method selection, order placement, counter QR. |
| `/signin` | `src/app/signin.js` → `src/screens/signin/signin.screen.js` | Shared sign-in; redirects by role. |
| `/staff` | `src/app/(staff)/staff/index.js` | Protected staff area; redirects to `/staff/orders`. |
| `/staff/orders` | `src/app/(staff)/staff/orders.js` → `src/screens/staff/orders/verify.screen.js` | Counter QR verification and order completion (protected). |
| `/admin` | `src/app/(admin)/admin/index.js` → `src/screens/admin/admin.screen.js` | Admin dashboard (protected). |
| `/admin/items` | `src/app/(admin)/admin/items.js` → `src/screens/admin/items/items.screen.js` | Admin menu management (protected). |
| `/admin/orders` | `src/app/(admin)/admin/orders.js` → `src/screens/admin/orders/orders.screen.js` | Admin order audit (protected). |
| `/admin/profiles` | `src/app/(admin)/admin/profiles.js` → `src/screens/admin/profiles/profiles.screen.js` | Read-only profile audit (protected). |
| `/admin/audit-logs` | `src/app/(admin)/admin/audit-logs.js` → `src/screens/admin/audit-logs/audit-logs.screen.js` | Admin audit trail (protected). |
| 404 fallback | `src/app/+not-found.js` | Not-found screen. |
| document shell | `src/app/+html.js` | HTML metadata and PWA manifest link. |
| `/api/health` | `src/app/api/health+api.js` | JSON health probe used by Docker. |
| `/api/items` | `src/app/api/items/+api.js` | Public menu listing (`GET`); admin create (`POST`). |
| `/api/items/[id]` | `src/app/api/items/[id]+api.js` | Admin item update/delete (`PATCH`/`DELETE`). |
| `/api/checkout` | `src/app/api/checkout+api.js` | Public kiosk checkout (`POST`), returns order + counter QR. |
| `/api/signin` | `src/app/api/signin+api.js` | Staff sign-in. |
| `/api/session` | `src/app/api/session+api.js` | Validates bearer token and returns the current profile. |
| `/api/signout` | `src/app/api/signout+api.js` | Revokes the current session. |
| `/api/admin/orders` | `src/app/api/admin/orders/+api.js` | Admin orders listing and create (`GET`/`POST`). |
| `/api/admin/orders/[id]` | `src/app/api/admin/orders/[id]+api.js` | Admin order read/update/delete (`GET`/`PATCH`/`DELETE`). |
| `/api/admin/profiles` | `src/app/api/admin/profiles+api.js` | Read-only admin profile listing (`GET`) and status update (`PATCH`). |
| `/api/admin/audit-logs` | `src/app/api/admin/audit-logs/+api.js` | Admin audit trail listing (`GET`). |
| `/api/staff/orders/verify` | `src/app/api/staff/orders/verify+api.js` | Staff order verification (`POST`). |
| `/api/staff/orders/[id]` | `src/app/api/staff/orders/[id]+api.js` | Staff order completion (`PATCH`). |
| `/manifest.json` | `src/app/manifest.json+api.js` | PWA manifest with `any` and `maskable` icons. |
| `/robots.txt` | `src/app/robots.txt+api.js` | Allows all crawlers. |
| `/service-worker.js` | `src/app/service-worker.js+api.js` | Minimal service worker, registered on mount. |

## Project structure

```text
./
├── .github/
│   └── workflows/
│       ├── deploy-expo.yml
│       └── deploy-supabase.yml
├── png/
│   ├── logo-maskable.png
│   └── logo.png
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── audit-logs.js
│   │   │   │   ├── index.js
│   │   │   │   ├── items.js
│   │   │   │   ├── orders.js
│   │   │   │   └── profiles.js
│   │   │   └── _layout.js
│   │   ├── (staff)/
│   │   │   ├── staff/
│   │   │   │   ├── index.js
│   │   │   │   └── orders.js
│   │   │   └── _layout.js
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── audit-logs/
│   │   │   │   │   └── +api.js
│   │   │   │   ├── orders/
│   │   │   │   │   ├── +api.js
│   │   │   │   │   └── [id]+api.js
│   │   │   │   └── profiles+api.js
│   │   │   ├── items/
│   │   │   │   ├── +api.js
│   │   │   │   └── [id]+api.js
│   │   │   ├── staff/
│   │   │   │   └── orders/
│   │   │   │       ├── [id]+api.js
│   │   │   │       └── verify+api.js
│   │   │   ├── checkout+api.js
│   │   │   ├── health+api.js
│   │   │   ├── session+api.js
│   │   │   ├── signin+api.js
│   │   │   └── signout+api.js
│   │   ├── +html.js
│   │   ├── +not-found.js
│   │   ├── _layout.js
│   │   ├── cart.js
│   │   ├── index.js
│   │   ├── manifest.json+api.js
│   │   ├── menu.js
│   │   ├── robots.txt+api.js
│   │   ├── service-worker.js+api.js
│   │   └── signin.js
│   ├── components/
│   │   ├── accordion.js
│   │   ├── alert.js
│   │   ├── button.js
│   │   ├── circular-progress.js
│   │   ├── container.js
│   │   ├── empty-state.js
│   │   ├── form-actions.js
│   │   ├── header.js
│   │   ├── inline-editable-cell.js
│   │   ├── inline-select.js
│   │   ├── qr-code.js
│   │   ├── qr-scanner.js
│   │   ├── section-header.js
│   │   ├── snackbar.js
│   │   ├── stat-card.js
│   │   ├── stat-grid.js
│   │   ├── status-pill.js
│   │   ├── table.js
│   │   └── text-field.js
│   ├── database/
│   │   └── instance.js
│   ├── domain/
│   │   ├── audit/
│   │   │   └── summary.js
│   │   ├── auth/
│   │   │   └── roles.js
│   │   ├── items/
│   │   │   └── schema.js
│   │   ├── menu/
│   │   │   └── sections.js
│   │   ├── orders/
│   │   │   ├── constants.js
│   │   │   ├── items.js
│   │   │   ├── pricing.js
│   │   │   ├── qr.js
│   │   │   ├── schema.js
│   │   │   ├── status.js
│   │   │   └── totals.js
│   │   └── profiles/
│   ├── endpoints/
│   │   ├── admin/
│   │   │   ├── audit-logs/
│   │   │   │   └── index.js
│   │   │   ├── orders/
│   │   │   │   ├── [id].js
│   │   │   │   └── index.js
│   │   │   └── profiles.js
│   │   ├── checkout/
│   │   │   └── index.js
│   │   ├── items/
│   │   │   ├── [id].js
│   │   │   ├── index.js
│   │   │   └── validation.js
│   │   ├── session/
│   │   │   └── index.js
│   │   ├── signin/
│   │   │   └── index.js
│   │   ├── signout/
│   │   │   └── index.js
│   │   ├── staff/
│   │   │   └── orders/
│   │   │       ├── [id].js
│   │   │       └── verify.js
│   │   └── health.js
│   ├── interceptors/
│   │   ├── authentication.interceptor.js
│   │   ├── authorization.interceptor.js
│   │   ├── body.interceptor.js
│   │   ├── error.interceptor.js
│   │   ├── log.interceptor.js
│   │   └── method.interceptor.js
│   ├── repositories/
│   │   ├── audit.repository.js
│   │   ├── auth.repository.js
│   │   ├── item.repository.js
│   │   ├── order.repository.js
│   │   └── profile.repository.js
│   ├── screens/
│   │   ├── admin/
│   │   │   ├── audit-logs/
│   │   │   │   └── audit-logs.screen.js
│   │   │   ├── items/
│   │   │   │   ├── item-form.component.js
│   │   │   │   ├── items-table.component.js
│   │   │   │   └── items.screen.js
│   │   │   ├── orders/
│   │   │   │   ├── orders-form.component.js
│   │   │   │   ├── orders-table.component.js
│   │   │   │   └── orders.screen.js
│   │   │   ├── profiles/
│   │   │   │   ├── profiles-table.component.js
│   │   │   │   └── profiles.screen.js
│   │   │   └── admin.screen.js
│   │   ├── cart/
│   │   │   ├── cart-items.component.js
│   │   │   ├── cart-placed.component.js
│   │   │   └── cart.screen.js
│   │   ├── menu/
│   │   │   └── menu.screen.js
│   │   ├── signin/
│   │   │   └── signin.screen.js
│   │   ├── staff/
│   │   │   └── orders/
│   │   │       └── verify.screen.js
│   │   └── root.js
│   ├── services/
│   │   ├── admin.js
│   │   ├── audit.js
│   │   ├── auth.js
│   │   ├── checkout.js
│   │   ├── items.js
│   │   ├── orders.js
│   │   ├── realtime.js
│   │   └── staff.js
│   ├── shared/
│   │   ├── cipher/
│   │   │   ├── decode.js
│   │   │   ├── decrypt.js
│   │   │   ├── encode.js
│   │   │   ├── encrypt.js
│   │   │   ├── hash.js
│   │   │   ├── id.js
│   │   │   └── token.js
│   │   ├── constants/
│   │   │   ├── config.js
│   │   │   ├── http.js
│   │   │   ├── layout.js
│   │   │   └── theme.js
│   │   ├── errors/
│   │   │   ├── bad-gateway.js
│   │   │   ├── bad-request.js
│   │   │   ├── database-unconfigured.js
│   │   │   ├── database-upstream.js
│   │   │   ├── decrypt-error.js
│   │   │   ├── encrypt-error.js
│   │   │   ├── forbidden.js
│   │   │   ├── hash-error.js
│   │   │   ├── internal.js
│   │   │   ├── message.js
│   │   │   ├── normalize.js
│   │   │   ├── not-found.js
│   │   │   ├── service-unavailable.js
│   │   │   ├── too-many-requests.js
│   │   │   └── unauthorized.js
│   │   ├── format/
│   │   │   ├── currency.js
│   │   │   ├── date.js
│   │   │   └── email.js
│   │   ├── network/
│   │   │   ├── middleware.js
│   │   │   ├── request.js
│   │   │   ├── response.js
│   │   │   └── transport.js
│   │   ├── stylesheets/
│   │   │   └── global.css
│   │   ├── utils/
│   │   │   ├── lists.js
│   │   │   └── records.js
│   │   └── validation/
│   │       ├── email.js
│   │       ├── password.js
│   │       └── request.js
│   └── stores/
│       ├── app.store.js
│       ├── audit-logs.store.js
│       ├── auth.store.js
│       ├── cart.store.js
│       ├── items.store.js
│       ├── notification.store.js
│       ├── orders.store.js
│       ├── profiles.store.js
│       └── staff-orders.store.js
├── supabase/
│   ├── migrations/
│   │   ├── 20261117000000_extensions.sql
│   │   ├── 20261117000001_profiles.sql
│   │   ├── 20261117000002_items.sql
│   │   ├── 20261117000003_orders.sql
│   │   ├── 20261117000004_order_items.sql
│   │   └── 20261117000005_audit_logs.sql
│   ├── seeds/
│   │   ├── 00_admin.sql
│   │   ├── 01_staff.sql
│   │   └── 02_items.sql
│   ├── snippets/
│   ├── .gitignore
│   └── config.toml
├── svg/
│   ├── logo-maskable.svg
│   └── logo.svg
├── test/
│   ├── architecture/
│   │   └── layers.test.js
│   ├── domain/
│   │   ├── audit/
│   │   │   └── summary.test.js
│   │   ├── auth/
│   │   │   └── roles.test.js
│   │   ├── menu/
│   │   │   └── sections.test.js
│   │   ├── orders/
│   │   │   ├── items.test.js
│   │   │   ├── pricing.test.js
│   │   │   ├── qr.test.js
│   │   │   ├── rules.test.js
│   │   │   └── totals.test.js
│   │   └── schemas.test.js
│   ├── endpoints/
│   │   └── items-validation.test.js
│   ├── integration/
│   │   ├── endpoints/
│   │   └── middleware-endpoint.test.js
│   ├── services/
│   │   ├── admin.test.js
│   │   ├── audit.test.js
│   │   ├── auth.test.js
│   │   ├── checkout.test.js
│   │   ├── http.test.js
│   │   ├── items.test.js
│   │   ├── orders.test.js
│   │   └── staff.test.js
│   └── shared/
│       ├── errors/
│       │   ├── message.test.js
│       │   └── normalize.test.js
│       ├── format/
│       │   ├── currency.test.js
│       │   ├── date.test.js
│       │   └── email.test.js
│       ├── network/
│       │   ├── middleware.test.js
│       │   ├── request.test.js
│       │   ├── response.test.js
│       │   └── transport.test.js
│       ├── utils/
│       │   ├── lists.test.js
│       │   └── records.test.js
│       └── validation/
│           ├── email.test.js
│           ├── password.test.js
│           └── request.test.js
├── ttf/
│   └── Outfit-VariableFont_wght.ttf
├── .dockerignore
├── .gitignore
├── AGENTS.md
├── CONTRIBUTING.md
├── Caddyfile
├── DESIGN.md
├── Dockerfile
├── LICENSE.txt
├── README.md
├── app.config.js
├── babel.config.js
├── docker-compose.yml
├── eas.json
├── metro.config.js
├── opencode.json
├── package-lock.json
├── package.json
└── tailwind.config.js
```
