# RizinOS - Developer Guide

The **dynamic backend** of RizinOS. SvelteKit + Bun + Drizzle ORM + PostgreSQL.

## Sibling project: `rizinos-web` (static frontend)

[`../rizinos-web`](../rizinos-web) is the static SPA served from a CDN/static host. It owns the marketing site, login/signup forms, and admin dashboard. It calls this backend's `/api/*` endpoints via `api.rizinos.com`.

In **production**, nginx uses separate subdomains:

- `app.rizinos.com` - this server (Bun, port 3001): OS desktop shell + `/api/*`, `/storage/*`, `/ws`, `/_os`
- `rizinos.com` - `rizinos-web` (static build at `/var/www/rizinos-web`): marketing site, login, signup
- `api.rizinos.com` - proxies to this server (port 3001), path `/auth/login` maps to backend `/api/auth/login` (no `/api` prefix needed in frontend calls)

In **dev**, `rizinos-web` runs on port 3003 and proxies `/api` + `/ws` to this server (port 3002).

See [`../rizinos-web/CLAUDE.md`](../rizinos-web/CLAUDE.md) and [`../rizinos-web/README.md`](../rizinos-web/README.md) for frontend conventions, i18n details, admin API usage, and deployment.

## Dev Commands

```sh
bun run dev          # SvelteKit + WebSocket server (concurrent)
bun run build        # vite build + bun server bundle
bun run check        # svelte-check type check
bun run db:push      # push Drizzle schema to local DB (localhost/rizinos_test)
bun run db:push:prod # push Drizzle schema to production DB (192.168.10.85/rizinos_test)
bun run db:studio    # open Drizzle Studio
```

## Project Structure

```
src/
  routes/
    (homepage)/        # Marketing site: /, /login, /signup, /about, legal pages
    app/               # OS desktop shell (authenticated)
    admin/             # Admin dashboard: user management, minecraft management
    api/
      mc/              # Minecraft plugin HTTP API (start/stop, inventory, warps, etc.)
      minechat/        # Minechat Discord-Minecraft bridge
      os/              # OS-level API (fso, ip, logout, online, send-mail, version)
      [...params]      # Catch-all: returns 400 Invalid endpoint
    storage/           # File storage route
  lib/
    client/            # Client-only: shell state, notifications, websocket, media, menu
      components/      # Client UI components (homepage/, os/)
    components/        # Shared UI: Modal, InlineEdit, LocationEditor, RestrictEditor
      ui/              # shadcn-svelte primitives (button, table, input, etc.)
    server/            # Server-only: auth, db, files, models, websocket
      db/              # Drizzle schema files + relations
      models/          # Domain logic: User, device, token, Logger, ProcessHandler
  server.ts            # Bun HTTP + WebSocket server entry (used after build)
messages/              # i18n source files (per-topic JSON, auto-compiled)
```

## Tech Stack

- **Runtime:** Bun
- **Framework:** SvelteKit (Svelte 5 runes only, no legacy stores)
- **Styling:** Tailwind CSS v4 + shadcn-svelte (complex UI) + DaisyUI (simple widgets)
- **Database:** PostgreSQL via Drizzle ORM (beta.21)
- **Icons:** `@lucide/svelte` (not `lucide-svelte`)
- **Auth:** Cookie-based sessions (loginToken + deviceToken); Google OAuth via Arctic
- **WebSocket:** Custom Bun WebSocket server at `/ws`

## i18n System

Messages live in `messages/*.json` (per-topic files: `common.json`, `home.json`, `login.json`, `signup.json`, `confirm.json`, `error.json`). Each key maps to an array of `[de, en, cn, ru]` translations.

`common.json` is reserved for general keys reused across multiple pages (e.g. nav labels, the global Header/Footer). Page- or feature-specific strings belong in their own topic file, not in `common.json`.

A Vite plugin (`src/lib/i18n-plugin.ts`) compiles these into `src/lib/messages.ts` (auto-generated, gitignored) at dev/build time. Default locale is `de`. Import translation functions directly:

```ts
import { title, description } from '$lib/messages';
```

## Database Schema

Schema is split by domain in `src/lib/server/db/`:

- `schemaUsers.ts` - users, tokens, devices, transactions
- `schemaMinecraft.ts` - mcUsers, mcWarps, mcWorlds, mcWorldGroups, mcInventories, mcWorth
- `schemaMinechat.ts` - minechatUsers, minechatServers, minechatHooks
- `schemaFiles.ts` - file_meta (VFS)
- `schemaDiscord.ts` - dcUsers
- `schemaApps.ts`, `schemaLog.ts`

## Key Conventions

- Svelte 5 runes throughout (`$state`, `$derived`, `$effect`, `$props`)
- `$lib/` imports, never relative paths from `src/`
- shadcn-svelte imported as `$shadcn/<component>` (configured in tsconfig)
- `restrict` column in Minecraft tables = permission-gated access control
- Snowflake IDs for users/files; serial/text PKs elsewhere
- No em dashes anywhere (use dash, colon, or newline instead)

## Deployment

```sh
bun run deploy       # runs scripts/deploy.ts
```

PM2 config at `pm2.config.cjs`. Server runs on `PORT` env var (default 3000).

**Production nginx config** lives in the NixOS flake at `/etc/nixos/hosts/pronix/default.nix` (host `pronix`, the production server). `app.rizinos.com` proxies entirely to this backend (Bun on `:3001`), including `/ws` (WebSocket). `rizinos.com` serves the static frontend (`rizinos-web`). `api.rizinos.com` also proxies to this backend. Apply changes on the server with `sudo nixos-rebuild switch --flake /etc/nixos#pronix` (not the local `prenix` host).
