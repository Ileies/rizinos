# rizinos

The **dynamic backend** of [RizinOS](https://github.com/Ileies/rizinos) - the first operating system that runs in your browser.

This repo houses the OS desktop shell, all API endpoints, the WebSocket server, and the PostgreSQL database. It is a SvelteKit app running on Bun with a custom `server.ts` entry point. A reverse proxy puts it on the same origin as the static frontend ([`rizinos-web`](../rizinos-web)) so auth cookies work seamlessly without CORS.

## Sibling project

> **Frontend:** [`../rizinos-web`](../rizinos-web) - the static SPA that serves the marketing site, login/signup forms, and admin dashboard. It calls this backend's `/api/*` endpoints over the same origin. See its [CLAUDE.md](../rizinos-web/CLAUDE.md) for frontend conventions.

In production, nginx routes traffic on one origin:

| Path prefix                           | Served by                                            |
| ------------------------------------- | ---------------------------------------------------- |
| `/app`, `/api/*`, `/storage/*`, `/ws` | this backend (Bun, port 3001)                        |
| Everything else                       | rizinos-web (static build at `/var/www/rizinos-web`) |

---

## What lives here

| Route           | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `/app`          | OS desktop shell - SSR-rendered, authenticated                          |
| `/api/auth/*`   | Login, signup, confirm-email, session, Google OAuth                     |
| `/api/admin/*`  | User management, Minecraft controls, Discord/Minechat                   |
| `/api/mc/*`     | Minecraft plugin HTTP API (start/stop, inventory, warps, credit, homes) |
| `/api/os/*`     | OS-level API (file ops, IP, logout, online status, version, mail)       |
| `/api/minechat` | Discord-Minecraft bridge endpoints                                      |
| `/storage/*`    | User file storage                                                       |
| `/ws`           | Custom Bun WebSocket server for live OS events                          |

---

## Tech stack

| Layer           | Technology                                                                |
| --------------- | ------------------------------------------------------------------------- |
| Runtime         | Bun                                                                       |
| Framework       | SvelteKit 2 + Svelte 5 (runes only)                                       |
| Adapter         | `adapter-node` + custom `src/server.ts` WebSocket server                  |
| Database        | PostgreSQL via Drizzle ORM                                                |
| Styling         | Tailwind CSS v4 + shadcn-svelte                                           |
| Icons           | `@lucide/svelte`                                                          |
| Auth            | Cookie-based sessions (loginToken + deviceToken); Google OAuth via Arctic |
| i18n            | Custom Vite plugin, 4 locales: de / en / cn / ru                          |
| Process manager | PM2 (production)                                                          |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL running locally (see `.env.template`)

### Install

```sh
bun install
```

### Environment

Copy `.env.template` to `.env` and fill in the required values (database URL, Google OAuth credentials, mail settings, etc.).

### Database

```sh
bun run db:push      # push Drizzle schema to the database
bun run db:studio    # open Drizzle Studio in the browser
```

### Develop

```sh
bun run dev          # SvelteKit dev server + WebSocket server (concurrent, port 3002)
```

The static frontend ([`rizinos-web`](../rizinos-web)) runs on port 3003 and proxies `/api` + `/ws` to this server.

### Build

```sh
bun run build        # vite build + bun server bundle → build/
bun run preview      # run the production bundle locally
```

### Type check / lint

```sh
bun run check        # svelte-check
bun run lint         # prettier + eslint
bun run format       # prettier --write
```

---

## Project structure

```
src/
  routes/
    app/                   # OS desktop shell (SSR, authenticated)
      +page.server.ts      # Session guard: redirect to /login if not authenticated
      +page.svelte
    api/
      auth/                # Auth API (login, signup, confirm-email, session, Google OAuth)
      admin/               # Admin API (users, Minecraft, Discord, Minechat)
      mc/                  # Minecraft plugin HTTP API
      os/                  # OS-level API (fso, ip, logout, online, send-mail, version)
      minechat/            # Minechat bridge
      [...params]/         # Catch-all: returns 400 Invalid endpoint
    storage/               # File storage (serves user files from VFS)
  lib/
    client/                # Client-only code (shell state, WebSocket, notifications, menus)
      components/
        os/                # OS UI components (window manager, taskbar, apps)
    components/
      ui/                  # shadcn-svelte primitives
    server/                # Server-only code (never imported by client)
      auth.ts              # Session creation, cookie handling, Google OAuth
      files.ts             # VFS file operations
      websocket.ts         # WebSocket message handling
      db/
        schema.ts          # Drizzle schema barrel
        schemaUsers.ts     # users, tokens, devices, transactions
        schemaMinecraft.ts # mcUsers, mcWarps, mcWorlds, mcInventories, mcWorth
        schemaMinechat.ts  # minechatUsers, minechatServers, minechatHooks
        schemaFiles.ts     # file_meta (VFS)
        schemaDiscord.ts   # dcUsers
        schemaApps.ts
        schemaLog.ts
        relations.ts       # Drizzle relation definitions
        index.ts           # db client export
        lib.ts             # DB utilities
      models/
        User.ts            # User domain model
        device.ts          # Device trust logic
        token.ts           # Token generation / validation
        Logger.ts          # Structured logger
        ProcessHandler.ts  # Minecraft process management
        Snowflake.ts       # Snowflake ID generator
        Transaction.ts     # Credit transaction model
    config.ts              # Social links
    formValidation.ts      # Zod validators
    i18n-plugin.ts         # Vite plugin: messages/*.json → messages.ts
    os.svelte.ts           # OS state (Svelte 5 runes)
    utils.ts
  server.ts                # Bun HTTP + WebSocket server entry (production)
  types/                   # Shared TypeScript types
messages/                  # i18n source files (JSON per topic)
```

### Path aliases

| Alias     | Points to                   |
| --------- | --------------------------- |
| `$lib`    | `src/lib`                   |
| `$db`     | `src/lib/server/db`         |
| `$types`  | `src/types`                 |
| `$ui`     | `src/lib/client/components` |
| `$shadcn` | `src/lib/components/ui`     |

---

## Database schema

Schema is split by domain in `src/lib/server/db/`:

| File                 | Tables                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `schemaUsers.ts`     | `users`, `tokens`, `devices`, `transactions`                                  |
| `schemaMinecraft.ts` | `mcUsers`, `mcWarps`, `mcWorlds`, `mcWorldGroups`, `mcInventories`, `mcWorth` |
| `schemaMinechat.ts`  | `minechatUsers`, `minechatServers`, `minechatHooks`                           |
| `schemaFiles.ts`     | `file_meta` (VFS)                                                             |
| `schemaDiscord.ts`   | `dcUsers`                                                                     |
| `schemaApps.ts`      | apps                                                                          |
| `schemaLog.ts`       | logs                                                                          |

- Snowflake IDs for users and files; serial / text PKs elsewhere
- `restrict` column in Minecraft tables = permission-gated access control

---

## Auth

Cookie-based sessions with two tokens:

- `loginToken` - short-lived session token, rotated on each request
- `deviceToken` - long-lived device trust token; recognized devices skip re-auth

Google OAuth via the [Arctic](https://arctic.js.org) library. OAuth start and callback are at `/api/auth/google` and `/api/auth/google/callback`.

Password hashing is handled server-side in `src/lib/server/auth.ts`.

---

## i18n

See [`../rizinos-web/CLAUDE.md`](../rizinos-web/CLAUDE.md) for full i18n documentation - the system is identical in both repos (same Vite plugin, same `messages/*.json` format). The backend uses SSR-time locale replacement (reads the `LOCALE` cookie in the request).

---

## Deployment

```sh
bun run build      # build to build/
bun run deploy     # runs scripts/deploy.ts
```

`scripts/deploy.ts` copies config files into `build/`, SSHes to `root@${PUBLIC_ORIGIN}`, rsyncs the bundle, installs dependencies, and restarts PM2.

PM2 config: `pm2.config.cjs`. The server runs on `PORT` env var (default `3001` in production).

The static frontend (`rizinos-web`) is deployed separately. See [`../rizinos-web/CLAUDE.md`](../rizinos-web/CLAUDE.md).

---

## Feature roadmap

See [FEATURES.md](./FEATURES.md) for a full breakdown of implemented, in-progress, and planned features across the OS, applications, infrastructure, and integrations.

---

## Links

- GitHub: <https://github.com/Ileies/rizinos>
- Discord: <https://discord.gg/p4fMb3y2R5>
- Twitter/X: <https://x.com/rizinos>
