# Status page

Public status at `https://rizinos.com/status`, backed by three parts:

| Part                                        | Role                                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`../rizinos-status`](../../rizinos-status) | Separate Bun service on `pronix`. Probes every component once a minute and writes results to this database.          |
| this repo                                   | Owns the schema, builds the public and admin payloads, lets admins post incidents and maintenance, notifies Discord. |
| [`../rizinos-web`](../../rizinos-web)       | Renders `/status` (public) and the admin tools (`/admin` and below the public page for admins).                      |

The prober is deliberately **not** inside this server: a backend cannot report its own crash.

## Data flow

```
rizinos-status ──writes──> status_components / status_checks / status_daily / status_meta
                           status_incidents (auto-detected drafts only)
                                  │
admin dashboard ──POST /api/admin/status──> status_incidents, status_maintenance, component settings
                                  │                          └──> Discord bot POST /status/notify
rizinos-web  <──GET /api/status (public, cached)──  src/lib/server/status/queries.ts
             <──GET /api/status/banner (tiny)────
             <──GET /api/admin/status (admin only)
```

## Tables (`src/lib/server/db/schemaStatus.ts`)

| Table                                           | Written by      | Purpose                                                                                                          |
| ----------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `status_components`                             | prober, admin   | One row per component: probe state and streaks (prober), `paused`, `auto_incident`, thresholds, interval (admin) |
| `status_checks`                                 | prober          | Raw probe results, kept 7 days                                                                                   |
| `status_daily`                                  | prober          | Per component and UTC day rollup, kept 400 days. The page shows 90                                               |
| `status_meta`                                   | prober, backend | Key/value: `heartbeat`, `vitals` (prober), `probeRequest` (backend asks for an immediate probe)                  |
| `status_incidents` + `_components` + `_updates` | admin, prober   | Incidents. `published = false` means draft. `source` is `manual` or `auto`                                       |
| `status_maintenance` + `_components`            | admin           | Windows. The phase (scheduled, in progress, completed) is derived from the clock; only `cancelled_at` is stored  |

Component slugs and their probes are defined in `rizinos-status/src/probes/index.ts`. The prober seeds missing rows on startup.

## What the page shows

- **Component state** = worst of the probe state and any open published incident on it (`minor` shows degraded, `major`/`critical` show down). An active maintenance window overrides both and shows "Maintenance".
- **Overall state**: any core component (`api`, `database`) down, or half of all components down, is a `major_outage`. Some other component down is a `partial_outage`. Degraded, then maintenance, then operational. A stale monitor heartbeat (older than 3 minutes) is `unknown`: the page never shows green on stale data.
- **Uptime** counts samples whose state is not `down`. Degraded counts as up. Maintenance samples are excluded.
- **Day cells**: `down` from 5 minutes of downtime, `degraded` for any shorter downtime or 5 degraded minutes, otherwise operational. No data is its own state.
- Public extras: users online now (count of `users.is_online`, no names), backend version (`PUBLIC_VERSION`) and when this process started.
- Not public by design: latency, error messages, hostnames, Minecraft player counts, probe details. All of that is only in `/api/admin/status`.

## Endpoints

| Endpoint                 | Auth  | Notes                                                                                            |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------ |
| `GET /api/status`        | none  | Full page payload. Memoised for 5 s in-process, `Cache-Control: public, max-age=10`              |
| `GET /api/status/banner` | none  | Overall state plus open major/critical incidents and nearby maintenance, for site banners        |
| `GET /api/admin/status`  | admin | Components with raw details, latency percentiles, recent probes, vitals, drafts, all maintenance |
| `POST /api/admin/status` | admin | `{ action, ... }`, see below                                                                     |

Public responses never vary by session, so they are safe to cache. Admin data lives on its own endpoint for that reason.

Admin actions: `incidentCreate`, `incidentUpdate` (status, impact, title, components, update text), `incidentPublish`, `incidentDelete`, `maintenanceCreate`, `maintenanceUpdate`, `maintenanceCancel`, `maintenanceDelete`, `componentUpdate`, `probeNow`. Validation lives in `src/lib/server/status/validate.ts` (zod), logic in `mutations.ts`. Incident and maintenance text is English only, the page UI is translated.

## Incidents

- The prober opens **drafts** for components with `auto_incident` on: when a component is down, or has been degraded for 10 minutes. Nothing is public until an admin publishes the draft.
- A draft that recovers within 5 minutes is deleted (a blip). A longer one stays as `resolved` for review. A published one moves to `monitoring` and waits for an admin to resolve it.
- The Minecraft component has `auto_incident` off: the game server is started and stopped on demand and counts as down when stopped, but must not create incidents.
- Manual incidents can be published right away or saved as private drafts.

## Discord

Publishing, updating, resolving and maintenance changes call the bot (`notifyStatus` in `src/lib/server/discordBot.ts`, `POST /status/notify`). The bot returns the message id, stored in `discord_message_id`, so later updates **edit the same message**. Failures are logged and never fail the admin action. The bot posts into `STATUS_CHANNEL_ID`; without it the bot answers 503 and nothing is posted. Bot source: `/projects/private/discord_rizinos` on `ros`, production build `/opt/discord_rizinos`.

## Setup and rollout

1. `bun run db:push` here (use `db:push:prod` for production, with the tunnel). Adds the `status_*` tables.
2. Deploy this backend.
3. Add `STATUS_CHANNEL_ID` to the bot's `.env`, deploy the bot (adds `/status/notify` and `/health`).
4. Deploy the prober (`rizinos-status`, systemd unit `rizinos-status.service`, see its README and `deploy/rizinos-status.nix`). Until it runs, the page shows "monitoring data is delayed" and no green.
5. Deploy `rizinos-web`.

## Gotchas

- **Timestamps**: `timestamp` columns are timezone-naive and hold UTC, but Postgres `now()` follows the session timezone (Europe/Berlin on dev). Always pass explicit `Date`s in status code, never `defaultNow()`. The prober refuses to start unless `TZ=UTC`.
- **jsonb from Bun SQL**: bind objects, not pre-stringified JSON (`${obj}::jsonb`), or the value is stored as a JSON string. Drizzle handles this for the backend; the prober uses Bun SQL directly.
- The request hook in `hooks.server.ts` checks the database on every request, so a healthy `/os/version` also proves the DB path. `/api/status` is excluded from request logging because the page polls it.

## Tests

`bun test tests/status.test.ts` covers the pure logic: state ranking, overall state, uptime and day cells, maintenance phases and validation.
