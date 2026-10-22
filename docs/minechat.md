# Minechat

Minechat connects one Discord channel to each registered Minecraft server. The
standalone Bun/discord.js bot lives on `ros` at
`/projects/private/discord_minechat`; its production bundle is
`/opt/discord_minechat/index.js` (`discord-minechat.service`).

## Setup

1. Apply `scripts/sql/minechat.sql` to the backend database, or use the existing
   Drizzle schema push workflow. The SQL only creates the two new tables and
   preserves existing users, servers and hooks. Run it as the database owner.
2. Set the same randomly generated `MINECHAT_BOT_SECRET` in the backend and bot
   environments. This is a separate credential from the Discord bot token.
   It is read at runtime, so it is not embedded in the build.
3. The bot's `API_URL` is the Minechat base URL, including its path:
   `https://api.rizinos.com/minechat/` in production or
   `http://localhost:3002/api/minechat/` in development.
4. Create a server using the existing Minechat admin API/UI. Its IP must be a
   numeric IPv4 or IPv6 address reachable by the backend on TCP port 7051.
   The IP is controlled by the administrator, never by an unauthenticated startup
   request. Update it through the admin API if the server moves.
5. As a logged-in administrator, POST
   `{ "action": "serverKey", "serverId": "your-server-id" }` to
   `/api/admin/minechat`. This returns `{ "success": true, "key": "..." }`.
   Save the key in the Minecraft plugin's private configuration. Calling this
   action again rotates the key and immediately revokes the previous key.
   Only its SHA-256 hash is stored in the database.
6. Update the Minecraft plugin's HTTP calls to the contract below. The legacy
   `minechat.php` query API is not supported. The plugin source is not in this
   repository or the bot project and must be updated separately.
7. Build/restart the backend and bot after configuration and database setup.

The bot needs the Message Content gateway intent, permission to read/send messages
in linked channels, and Manage Webhooks. Users need Administrator permission for
`/link`, `/quit` and `/prefix`. `/token` and `/help` are available to users.

## HTTP contract

All actions use `POST` with `Content-Type: application/json`. Internally, URLs are
`/api/minechat/{actor}/{action}`. The public API host removes the `/api` prefix.

Bot requests use `x-minechat-bot-secret: <MINECHAT_BOT_SECRET>`. Plugin requests
use `x-minechat-server-key: <server key>` and include `serverId` in the JSON body.
These headers are independent of RizinOS API bearer tokens and cookie sessions.
Use HTTPS outside the host. Never put keys or pairing tokens in URLs.

Success responses are `{ "ok": true, ... }`. Errors are
`{ "ok": false, "error": { "code": "...", "message": "..." } }`, with an
appropriate HTTP status: 400 for invalid input/tokens, 401 for credentials, 403 for
unlinked players, 404 for missing links/actions, 409 for existing links, and 502
for unavailable Discord/Minecraft delivery.

### Bot actions

| Action   | JSON fields                                                                          | Additional success fields                                        |
| -------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `list`   | none                                                                                 | `channels: string[]`, without webhook secrets                    |
| `link`   | `channel`, `id` (webhook ID), `token` (webhook secret), `key` (server pairing token) | none                                                             |
| `quit`   | `channel`                                                                            | `webhook: { id, token }` or `null`; bot deletes returned webhook |
| `token`  | `user` (Discord ID), `token` (player pairing token)                                  | `minecraftName`                                                  |
| `prefix` | `channel`, `prefix`                                                                  | none                                                             |
| `msg`    | `channel`, `user`, `msg`                                                             | none                                                             |

The bot creates a webhook for `/link` and removes it if linking fails. Original
Discord messages stay in place; only the Minecraft copy is sent through the
backend. The bot ignores bot/webhook messages to prevent loops. Attachments alone
are not relayed. Channel membership refreshes every 30 seconds and after link or
unlink commands. API failures do not cause a Discord reconnect. Startup checks
Discord's session quota and waits for its reset when necessary.

### Minecraft plugin actions

Every request includes `serverId` and its server key header.

| Action  | Additional JSON fields  | Additional success fields                                          |
| ------- | ----------------------- | ------------------------------------------------------------------ |
| `start` | optional `version`      | `protocol: 1`, `tcpPort: 7051`                                     |
| `list`  | none                    | `channels: { channelId, prefix }[]`, scoped to this server         |
| `link`  | none                    | `token`, `expires` (ISO timestamp); enter token in Discord `/link` |
| `quit`  | `channel`               | none; announces unlink and removes the hook                        |
| `token` | `uuid`, `name`          | `token`, `expires`; player enters token in Discord `/token`        |
| `msg`   | `uuid`, `msg`           | none                                                               |
| `join`  | `uuid`, optional `name` | none                                                               |
| `leave` | `uuid`, optional `name` | none                                                               |

Unlinking succeeds even when the Discord webhook is missing or unavailable. The
announcement and webhook deletion are best effort, so administrators may need to
remove an orphaned webhook manually after a Discord outage.

UUIDs accept compact or hyphenated hexadecimal input and are stored in lowercase,
hyphenated form. Names use the Minecraft Java format, at most 16 characters.
Messages are limited to 2000 characters and prefixes to 100. `%1` in the prefix
expands to the linked Minecraft name. Prefix updates preserve spaces and Minecraft
formatting, while player messages have formatting/control characters removed.
Join/leave notices require a linked player; providing `name` updates their name.

Pairing tokens expire after ten minutes, are stored only as hashes, and are
consumed transactionally. Reissuing a pairing token invalidates the old one.
Conflicting links roll back token consumption. Player accounts and servers cannot
be reassigned through pairing: unlink via administration first. Pending pairings
are separate from completed links and survive backend restarts. Expired pending
rows are removed on the next token issuance. Legacy `minechat_users.token` values
are not accepted as pairing credentials.

Minecraft `@Name` mentions resolve to explicitly allowed Discord user mentions.
Webhook payloads disable automatic mention parsing, including `@everyone`, roles,
and raw user IDs. Discord user mentions resolve to Minecraft names when linked.

### TCP delivery to Minecraft

The backend connects to the administrator-configured IP on port 7051, writes a
four-byte unsigned little-endian **byte length**, then UTF-8 message bytes, and
closes the socket. The plugin must read the entire frame and decode UTF-8. This
fixes the old API's double encoding of Unicode. Connection/write errors produce
502 responses; there is no application-level acknowledgment in this protocol.
Allow TCP 7051 only from the backend host. The existing TCP protocol itself does
not carry credentials.

## Validation

```sh
bun run check
bun run build
bun test tests/minechat.test.ts
```

For the full PostgreSQL integration suite, point at a disposable/development
database where the test user may create schemas:

```sh
MINECHAT_TEST_DATABASE_URL=postgres://postgres@localhost/rizinos_test bun test tests/minechat.test.ts
```

The suite creates a uniquely named schema, applies the additive SQL migration,
tests against real PostgreSQL, and drops the schema afterward. It never truncates
application tables. Webhook calls are intercepted and TCP listeners use loopback.
Port 7051 on loopback must be available for the full relay test.
