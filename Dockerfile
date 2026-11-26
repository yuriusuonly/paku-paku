# Syntax: docker/dockerfile:1

# --- Build: install deps and export the static web app ---
FROM oven/bun:1.4.5-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Build-time client config: Expo inlines EXPO_PUBLIC_* values into the browser
# bundle, and Docker's build context excludes .env. Pass the local Supabase
# values as build args so the containerized app matches a local static build.
ARG EXPO_PUBLIC_SUPABASE_TARGET
ARG EXPO_PUBLIC_SUPABASE_LOCAL_URL
ARG EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_SUPABASE_TARGET=${EXPO_PUBLIC_SUPABASE_TARGET} \
    EXPO_PUBLIC_SUPABASE_LOCAL_URL=${EXPO_PUBLIC_SUPABASE_LOCAL_URL} \
    EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY=${EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY} \
    EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL} \
    EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}
RUN bun run expo:build

# --- Runtime image, shared by the two `docker-compose.yml` services ---
FROM oven/bun:1.4.5-alpine

# Build args from .env (via docker-compose `build.args`); consumed at runtime by
# the Caddyfile's `{$URL_PORT}`/`{$URL_PROXY_PORT}` placeholders.
ARG URL_PORT
ARG URL_PROXY_PORT
ENV URL_PORT=${URL_PORT} URL_PROXY_PORT=${URL_PROXY_PORT}

# Caddy binary from the official image
COPY --from=caddy:2-alpine /usr/bin/caddy /usr/local/bin/caddy

WORKDIR /app

# Production deps (expo serve needs expo CLI; all deps are runtime deps)
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY Caddyfile ./
COPY bin ./bin
COPY lib ./lib

# No CMD: both service commands are plain argv arrays in `docker-compose.yml` —
# the image is only the built artifact ("build once, define commands at the
# compose level"). `expo serve` needs `--port`, which the launcher takes from
# URL_PORT (injected as a container env var), so the commands live in compose.
