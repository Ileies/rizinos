# RizinOS - Developer Guide

A web-native operating system built with SvelteKit + Bun + Drizzle ORM + PostgreSQL.

## Dev Commands

```sh
bun run dev          # SvelteKit + WebSocket server (concurrent)
bun run build        # vite build + bun server bundle
bun run check        # svelte-check type check
bun run db:push      # push Drizzle schema to DB
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

Messages live in `messages/*.json` (per-topic files: `common.json`, `home.json`, `login.json`, `signup.json`). Each key maps to an array of `[de, en, cn, ru]` translations.

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
bun run deploy       # runs deploy.ts
```

PM2 config at `pm2.config.cjs`. Server runs on `PORT` env var (default 3000).
