# Contact form

Backend for the public contact page (`rizinos-web` route `/contact`). Messages are stored in Postgres, forwarded by email, announced in Discord and managed in the admin dashboard.

## Flow

1. The page calls `GET /api/contact/challenge` and receives a signed, single-use token.
2. After at least 3 seconds (time trap) it sends `POST /api/contact` as `multipart/form-data`:
   - `payload`: JSON `{ topic, name, email, subject, message, locale, details, website, challenge }`
   - `attachments`: up to 3 images, 5 MB each (png, jpeg, webp, gif)
3. The server validates, stores the message and screenshots, then (best effort, never blocks the response):
   - mails the responsible mailbox (`Reply-To` is the sender)
   - mails a localised confirmation to the sender (`support@`, category `support`)
   - posts a notice to the Discord staff log via the bot (`/contact/notify`)
4. Response: `{ ok: true, ref: "RZ-7K3M9Q" }`

If the sender is signed in, `name` and `email` are always taken from the account and the message is linked to it (`userId`). A signed-in user cannot send as somebody else.

## Errors

| Status | `error`                                                                                 | Meaning                                                       |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 400    | `invalid_payload`                                                                       | Not multipart/JSON, or `payload` is not valid JSON            |
| 400    | `challenge_invalid` / `challenge_expired` / `challenge_too_fast` / `challenge_replayed` | Fetch a new challenge, wait, retry                            |
| 413    | `payload_too_large`                                                                     | Request exceeds attachments limit plus 256 KB                 |
| 422    | `validation`                                                                            | `issues: [{ field, code }]`, codes in `validate.ts`           |
| 422    | `attachment`                                                                            | `issue`: `too_many`, `too_large`, `unsupported_type`, `empty` |
| 429    | `rate_limited`                                                                          | `Retry-After` header and `retryAfter` seconds                 |
| 500    | `server_error`                                                                          | Message was not stored                                        |

A filled honeypot field (`website`) returns a fake `{ ok: true }` and stores nothing.

## Abuse protection

- **Honeypot** field `website`, hidden from real users.
- **Time trap** signed token (HMAC, key generated per process), single use, valid 3 seconds to 2 hours after issue.
- **Rate limits** in memory per process: 3 per 10 minutes and 10 per day per IP, 3 per hour per email address. The IP is the last `X-Forwarded-For` entry (the one nginx appends).
- Attachments are checked by magic bytes, never by client MIME type or extension. SVG is not accepted.

Limits reset when the process restarts. That is acceptable for a contact form behind a time trap.

## Routing

`TOPIC_MAILBOX` in `src/lib/server/contact/topics.ts` maps each topic to a mailbox that must exist on the mail server:

| Topic                             | Mailbox     |
| --------------------------------- | ----------- |
| general, account, bug, feedback   | `support@`  |
| security                          | `security@` |
| press                             | `press@`    |
| legal (abuse, DMCA, privacy/GDPR) | `privacy@`  |

`topics.ts` is mirrored by `rizinos-web/src/lib/contact.ts`. Change both together.

## Data and retention

Tables: `contact_messages`, `contact_replies`, `contact_attachments` (`schemaContact.ts`). Screenshots are stored on disk in `<STORAGE_DIRECTORY>/contact/` (`./uploads/contact/` in dev) and are only served to admins by `GET /api/admin/contact/attachment/:id`.

No IP address is stored. Messages (with replies and screenshots) are deleted automatically 12 months after creation (`RETENTION_MONTHS`). `startContactRetention()` in `hooks.server.ts` runs the purge one minute after startup and then every six hours. State this period in the privacy policy.

Apply the schema with `bun run db:push` (test) or `bun run db:push:prod`.

## Admin API (`/api/admin/contact`, admin role only)

- `GET ?status=active|new|open|resolved|spam|all&topic=&q=&contactPage=&contactPageSize=` returns `{ messages, total, counts }`
- `GET ?id=` returns `{ message, replies, attachments, account }`
- `POST { action: 'status', id, status }`
- `POST { action: 'reply', id, body }` sends an email from `support@` and records the reply. Fails with 502 (nothing recorded) if the mail cannot be sent.
- `POST { action: 'delete', id }` removes the message, replies and screenshot files

Incoming replies from the sender land in the `support@` mailbox, not in the dashboard. The reference stays in the subject so threads can be matched by hand.

## Tests

`bun test tests/contact.test.ts` covers validation, the challenge, rate limits, attachment sniffing and references (pure modules in `src/lib/server/contact/`, no `$app` imports so they stay testable).
