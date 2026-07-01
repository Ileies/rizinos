# TODO: RizinOS als OAuth 2.0 Anbieter

## Phase 1 - Datenbank

- [ ] `schemaOAuth.ts` erstellen mit 3 Tabellen:
  - `oauth_clients` - client_id, client_secret_hash, name, redirect_uris (array), allowed_scopes (array), logo_url, created_by (user_id)
  - `oauth_authorization_codes` - code, client_id, user_id, scope, redirect_uri, code_challenge (PKCE), expires (60s), used (bool)
  - `oauth_access_tokens` - token, client_id, user_id, scope, expires, revoked
- [ ] Relations in `relations.ts` ergänzen
- [ ] `db:push` ausführen

## Phase 2 - Typen & Scopes

- [ ] `src/types/oauth.ts` erstellen: Scope-Enum (`profile`, `email`, `offline_access`), Client-Typ, Token-Response-Typ

## Phase 3 - Server-Logik

- [ ] `src/lib/server/models/oauth.ts` erstellen:
  - `getClient(clientId)` + Geheimnis-Verifikation
  - `createAuthCode(clientId, userId, scope, redirectUri, codeChallenge?)`
  - `exchangeCode(code, codeVerifier?)` - validiert + invalidiert Code (One-Time-Use)
  - `createAccessToken(clientId, userId, scope)`
  - `revokeToken(token)`
  - `getUserInfoByToken(token)` - gibt scope-gefiltertes User-Objekt zurück

## Phase 4 - API-Endpunkte

- [ ] `GET /api/oauth/authorize` - validiert client_id, redirect_uri, scope; leitet zu Consent-Page weiter
- [ ] `POST /api/oauth/authorize` - verarbeitet User-Entscheidung, erzeugt Code, leitet zurück
- [ ] `POST /api/oauth/token` - tauscht code gegen access_token (Authorization Code + PKCE)
- [ ] `GET /api/oauth/userinfo` - gibt User-Daten per Bearer Token zurück (CORS-Header nötig)
- [ ] `POST /api/oauth/revoke` - widerruft Token
- [ ] `GET /.well-known/oauth-authorization-server` - Discovery-Dokument

## Phase 5 - Consent-UI

- [ ] Route `src/routes/app/oauth/authorize/+page.svelte` - Consent-Screen (App-Name, Logo, angeforderte Scopes, Bestätigen/Ablehnen-Buttons)
- [ ] Route `src/routes/app/oauth/authorize/+page.server.ts` - Auth-Check, Client-Lookup, Form-Action für Bestätigung

## Phase 6 - Admin-Verwaltung

- [ ] Neue Sektion in `rizinos-web` Admin-Dashboard: OAuth-Clients anlegen/löschen
- [ ] API-Endpunkte unter `/api/admin/oauth/` für Client-Verwaltung

## Phase 7 - Sicherheit & Korrektheit

- [ ] redirect_uri muss exakt mit registriertem Wert übereinstimmen (kein Prefix-Match)
- [ ] Authorization Codes nach einmaliger Nutzung sofort invalidieren
- [ ] CORS auf `/api/oauth/token` und `/userinfo` korrekt setzen (spezifische Origins, nicht `*`)
- [ ] client_secret nur als Hash speichern (bcrypt/argon2)
- [ ] Access Token Expiry: 1h, optional Refresh Token: 30 Tage

## Reihenfolge

Phase 1 - 2 - 3 - 4 - 5 - 6, Phase 7 parallel zu allem
