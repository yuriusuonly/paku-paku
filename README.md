# paku-paku

Paku paku (written in Japanese as ぱくぱく or パクパク) is a Japanese onomatopoeia that mimics the sound or action of a mouth repeatedly opening and closing.

Common Meanings & Uses:

- Eating heartily / gobbling up: Describing someone eating food quickly, eagerly, or bite after bite (e.g., paku paku taberu means to gobble something down).
- Mouth movement: Describing the motion of a mouth or jaw snapping open and shut, like a fish gasping for air.
- Pac-Man connection: The term inspired the name of the iconic video game character Pac-Man, coming from the phrase paku paku taberu.
- Origami: It is also the Japanese name for a paper fortune teller or chatterbox toy (pakupaku ningyo) that mimics a chomping mouth.

## Expo web app

A web-only Expo Router application for menu browsing, cart checkout, unified
buy/sell transactions with counter QR codes, inventory tracking, and admin
operations, backed by Supabase and packaged for local development, Docker, and
Expo Hosting.

- **Stack:** Expo SDK 58 + Expo Router (web-only, static output, API routes),
  React 19, React Native Web, NativeWind v4, Tailwind CSS v3, Zustand, plain
  JavaScript with JSDoc, and Supabase (local PostgreSQL for development and
  local builds, hosted Supabase on Expo Hosting).
- **Build:** `expo export --platform web` → `build/` (static export).
- **Deploy:** push to `main` triggers GitHub Actions, which pushes hosted Supabase migrations, exports the web
  build on the runner, and uploads only the artifact to Expo Hosting (EAS).
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

`supabase:reset` reapplies migrations and seeds the sample menu plus the
administrator account (`username: root`, `password: root`, role `admin`).
Authentication is username/password; the app derives an internal Supabase Auth
email (`root@paku-paku.local`) and never exposes it through the API. The seed
stores a static bcrypt hash so it does not depend on `pgcrypto`; rerunning the
seed restores that local password. The local auth config keeps
`minimum_password_length = 6`, so GoTrue may report the 4-character seed
password as weak while still accepting it. |

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
  .from("menu_items")
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

| Route | Source | Purpose |
| --- | --- | --- |
| `/` | `src/app/index.js` → `src/screens/root.js` | Storefront home with menu loaded from `/api/menu-items`. |
| `/signin` | `src/app/signin/index.js` → `src/screens/signin/signin-screen.js` | Username/password sign-in. |
| `/signup` | `src/app/signup/index.js` → `src/screens/signup/signup-screen.js` | Customer sign-up. |
| `/menu` | `src/app/menu/index.js` → `src/screens/menu/menu-screen.js` | Authenticated menu with add-to-cart. |
| `/cart` | `src/app/cart/index.js` → `src/screens/cart/cart-screen.js` | Customer cart and checkout; places a buy transaction and generates a QR code to present at the counter. |
| `/transactions` | `src/app/transactions/index.js` → `src/screens/transactions/transactions-screen.js` | Customer buy/sell transactions with QR codes for counter presentation. |
| `/account` | `src/app/account/index.js` → `src/screens/account/account-screen.js` | Customer account/profile details. |
| `/admin` | `src/app/admin/index.js` → `src/screens/admin/admin-screen.js` | Admin operations dashboard (protected). |
| `/admin/menu-items` | `src/app/admin/menu-items/index.js` → `src/screens/admin/menu-items/menu-items-screen.js` | Admin menu items management (protected). |
| `/admin/inventory` | `src/app/admin/inventory/index.js` → `src/screens/admin/inventory/inventory-screen.js` | Admin inventory management (protected). |
| `/admin/transactions` | `src/app/admin/transactions/index.js` → `src/screens/admin/transactions/transactions-screen.js` | Admin unified buy/sell transactions management (protected). |
| `/admin/profiles` | `src/app/admin/profiles/index.js` → `src/screens/admin/profiles/profiles-screen.js` | Admin profiles view/audit (protected). |
| 404 fallback | `src/app/+not-found.js` | Not-found screen. |
| document shell | `src/app/+html.js` | HTML metadata and PWA manifest link. |
| `/api/health` | `src/app/api/health+api.js` | JSON health probe used by Docker. |
| `/api/menu-items` | `src/app/api/menu-items/+api.js` | Menu items listing and admin create (`GET`/`POST`). |
| `/api/menu-items/[id]` | `src/app/api/menu-items/[id]+api.js` | Admin menu item update/delete (`PATCH`/`DELETE`). |
| `/api/signup` | `src/app/api/signup/+api.js` | Signs up a customer account and returns session/profile when available. |
| `/api/signin` | `src/app/api/signin/+api.js` | Username/password sign-in; returns session tokens and profile. |
| `/api/session` | `src/app/api/session/+api.js` | Validates bearer token and returns the current profile. |
| `/api/signout` | `src/app/api/signout/+api.js` | Revokes the current session. |
| `/api/transactions` | `src/app/api/transactions/+api.js` | Customer transactions list/create (`GET`/`POST`, checkout creates a buy transaction with items and counter QR code). |
| `/api/transactions/[id]` | `src/app/api/transactions/[id]+api.js` | Customer transaction read/update (`GET`/`PATCH`). |
| `/api/account/profile` | `src/app/api/account/profile+api.js` | Authenticated customer account profile (`GET`/`PATCH`). |
| `/api/admin/inventory` | `src/app/api/admin/inventory/+api.js` | Admin inventory listing and create (`GET`/`POST`). |
| `/api/admin/inventory/[id]` | `src/app/api/admin/inventory/[id]+api.js` | Admin inventory update/delete (`PATCH`/`DELETE`). |
| `/api/admin/transactions` | `src/app/api/admin/transactions/+api.js` | Admin transactions listing and create (`GET`/`POST`). |
| `/api/admin/transactions/[id]` | `src/app/api/admin/transactions/[id]+api.js` | Admin transaction read/update/delete (`GET`/`PATCH`/`DELETE`). |
| `/api/admin/profiles` | `src/app/api/admin/profiles+api.js` | Admin-only profile list and management (bearer token + admin role). |
| `/manifest.json` | `src/app/manifest.json+api.js` | PWA manifest with `any` and `maskable` icons. |
| `/robots.txt` | `src/app/robots.txt+api.js` | Allows all crawlers. |
| `/service-worker.js` | `src/app/service-worker.js+api.js` | Minimal service worker, registered on mount. |

## Project structure

```text
./
├── .dockerignore
├── .gitignore
├── .github/
│   ├── workflows/
│   │   ├── deploy-expo.yml
│   │   ├── deploy-supabase.yml
├── AGENTS.md
├── CONTRIBUTING.md
├── Caddyfile
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
├── tailwind.config.js
├── png/
│   ├── logo-maskable.png
│   ├── logo.png
├── src/
│   ├── app/
│   │   ├── account.js
│   │   ├── admin/
│   │   │   ├── index.js
│   │   │   ├── inventory.js
│   │   │   ├── menu-items.js
│   │   │   ├── profiles.js
│   │   │   ├── transactions.js
│   │   ├── api/
│   │   │   ├── account/
│   │   │   │   ├── profile+api.js
│   │   │   ├── admin/
│   │   │   │   ├── inventory/
│   │   │   │   │   ├── +api.js
│   │   │   │   │   ├── [id]+api.js
│   │   │   │   ├── profiles+api.js
│   │   │   │   ├── transactions/
│   │   │   │   │   ├── +api.js
│   │   │   │   │   ├── [id]+api.js
│   │   │   ├── health+api.js
│   │   │   ├── menu-items/
│   │   │   │   ├── +api.js
│   │   │   │   ├── [id]+api.js
│   │   │   ├── recover+api.js
│   │   │   ├── session+api.js
│   │   │   ├── signin+api.js
│   │   │   ├── signout+api.js
│   │   │   ├── signup+api.js
│   │   │   ├── transactions/
│   │   │   │   ├── +api.js
│   │   │   │   ├── [id]+api.js
│   │   ├── cart.js
│   │   ├── +html.js
│   │   ├── index.js
│   │   ├── _layout.js
│   │   ├── manifest.json+api.js
│   │   ├── menu.js
│   │   ├── +not-found.js
│   │   ├── recover.js
│   │   ├── robots.txt+api.js
│   │   ├── service-worker.js+api.js
│   │   ├── signin.js
│   │   ├── signup.js
│   │   ├── transactions.js
│   ├── components/
│   │   ├── accordion.js
│   │   ├── alert.js
│   │   ├── button.js
│   │   ├── circular-progress.js
│   │   ├── container.js
│   │   ├── empty-state.js
│   │   ├── header.js
│   │   ├── inline-editable-cell.js
│   │   ├── inline-select.js
│   │   ├── qr-code.js
│   │   ├── snackbar.js
│   │   ├── status-pill.js
│   │   ├── table.js
│   │   ├── text-field.js
│   ├── database/
│   │   ├── instance.js
│   ├── endpoints/
│   │   ├── account/
│   │   │   ├── profile.js
│   │   ├── admin/
│   │   │   ├── inventory/
│   │   │   │   ├── [id].js
│   │   │   │   ├── index.js
│   │   │   ├── profiles.js
│   │   │   ├── transactions/
│   │   │   │   ├── [id].js
│   │   │   │   ├── index.js
│   │   ├── health.js
│   │   ├── menu-items/
│   │   │   ├── [id].js
│   │   │   ├── index.js
│   │   ├── recover/
│   │   │   ├── index.js
│   │   ├── session/
│   │   │   ├── index.js
│   │   ├── signin/
│   │   │   ├── index.js
│   │   ├── signout/
│   │   │   ├── index.js
│   │   ├── signup/
│   │   │   ├── index.js
│   │   ├── transactions/
│   │   │   ├── [id].js
│   │   │   ├── index.js
│   ├── interceptors/
│   │   ├── authentication-interceptor.js
│   │   ├── authorization-interceptor.js
│   │   ├── body-interceptor.js
│   │   ├── error-interceptor.js
│   │   ├── log-interceptor.js
│   │   ├── method-interceptor.js
│   ├── repositories/
│   │   ├── auth-repository.js
│   │   ├── inventory-repository.js
│   │   ├── menu-repository.js
│   │   ├── profile-repository.js
│   │   ├── transaction-repository.js
│   ├── screens/
│   │   ├── account/
│   │   │   ├── account-form-component.js
│   │   │   ├── account-screen.js
│   │   ├── admin/
│   │   │   ├── admin-screen.js
│   │   │   ├── inventory/
│   │   │   │   ├── inventory-form-component.js
│   │   │   │   ├── inventory-list-component.js
│   │   │   │   ├── inventory-screen.js
│   │   │   ├── menu-items/
│   │   │   │   ├── menu-item-form-component.js
│   │   │   │   ├── menu-items-screen.js
│   │   │   │   ├── menu-items-table-component.js
│   │   │   ├── profiles/
│   │   │   │   ├── profiles-form-component.js
│   │   │   │   ├── profiles-screen.js
│   │   │   │   ├── profiles-table-component.js
│   │   │   ├── transactions/
│   │   │   │   ├── transactions-form-component.js
│   │   │   │   ├── transactions-screen.js
│   │   │   │   ├── transactions-table-component.js
│   │   ├── cart/
│   │   │   ├── cart-items-component.js
│   │   │   ├── cart-placed-component.js
│   │   │   ├── cart-screen.js
│   │   ├── menu/
│   │   │   ├── menu-screen.js
│   │   ├── recover/
│   │   │   ├── recover-screen.js
│   │   ├── root.js
│   │   ├── signin/
│   │   │   ├── signin-screen.js
│   │   ├── signup/
│   │   │   ├── signup-screen.js
│   │   ├── transactions/
│   │   │   ├── transactions-screen.js
│   ├── services/
│   │   ├── account.js
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── inventory.js
│   │   ├── menu.js
│   │   ├── realtime.js
│   │   ├── transactions.js
│   ├── shared/
│   │   ├── cipher/
│   │   │   ├── decode.js
│   │   │   ├── decrypt.js
│   │   │   ├── encode.js
│   │   │   ├── encrypt.js
│   │   │   ├── hash.js
│   │   │   ├── id.js
│   │   │   ├── token.js
│   │   ├── constants/
│   │   │   ├── config.js
│   │   │   ├── http.js
│   │   │   ├── layout.js
│   │   │   ├── theme.js
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
│   │   │   ├── unauthorized.js
│   │   ├── format/
│   │   │   ├── currency.js
│   │   │   ├── date.js
│   │   │   ├── email.js
│   │   ├── network/
│   │   │   ├── middleware.js
│   │   │   ├── request.js
│   │   │   ├── response.js
│   │   │   ├── transport.js
│   │   ├── stylesheets/
│   │   │   ├── global.css
│   │   ├── utils/
│   │   │   ├── lists.js
│   │   │   ├── records.js
│   ├── stores/
│   │   ├── app-store.js
│   │   ├── auth-store.js
│   │   ├── cart-store.js
│   │   ├── inventory-store.js
│   │   ├── menu-store.js
│   │   ├── notification-store.js
│   │   ├── profiles-store.js
│   │   ├── remember-email.js
│   │   ├── transactions-store.js
├── supabase/
│   ├── .gitignore
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20261113000000_create_menu_items.sql
│   │   ├── 20261113000001_create_profiles.sql
│   │   ├── 20261113000002_configure_menu_items_access.sql
│   │   ├── 20261113000003_configure_profiles_access.sql
│   │   ├── 20261114000000_create_inventory_and_sales.sql
│   │   ├── 20261116000000_full_business_operations.sql
│   │   ├── 20261116000001_replace_delivery_address_with_qr.sql
│   │   ├── 20261116000002_add_menu_item_best_seller.sql
│   │   ├── 20261116000003_unify_into_transactions.sql
│   ├── seeds/
│   │   ├── 00_root.sql
│   │   ├── 01_menu_items.sql
│   │   ├── 03_inventory_items.sql
│   ├── snippets/
├── svg/
│   ├── logo-maskable.svg
│   ├── logo.svg
├── test/
│   ├── integration/
│   │   ├── middleware-endpoint.test.js
│   ├── services/
│   │   ├── account.test.js
│   │   ├── admin.test.js
│   │   ├── auth.test.js
│   │   ├── http.test.js
│   │   ├── inventory.test.js
│   │   ├── menu.test.js
│   │   ├── transactions.test.js
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── message.test.js
│   │   │   ├── normalize.test.js
│   │   ├── format/
│   │   │   ├── currency.test.js
│   │   │   ├── date.test.js
│   │   │   ├── email.test.js
│   │   ├── network/
│   │   │   ├── middleware.test.js
│   │   │   ├── request.test.js
│   │   │   ├── response.test.js
│   │   │   ├── transport.test.js
│   │   ├── utils/
│   │   │   ├── lists.test.js
│   │   │   ├── records.test.js
├── ttf/
│   ├── Outfit-VariableFont_wght.ttf
```
