# Backend phase 1, usage pixel, buy me a coffee: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Cloudflare Worker + D1 backend for Pixel Arcade that counts visits, holds server accounts and global
leaderboards for every game, plus a grown-ups-gated "buy me a coffee" button.

**Architecture:** `api/` holds a Hono Worker (`pixel-arcade-api.matej-hron.workers.dev`) with an EU D1 database. The
static site stays build-free on GitHub Pages; `common.js` talks to the API (`PX.Api`), sends the visit beacon and
syncs every game's bests from localStorage (`PX.Scores`) with no game-file edits. `index.html` gets the account
changes, the leaderboard screen and the coffee button.

**Tech Stack:** Cloudflare Workers, D1, Hono ^4.12, Zod ^4.4, TypeScript ^7.0.2, Vitest ^4.1 with
@cloudflare/vitest-pool-workers ^0.18.6, wrangler ^4.158. Client: vanilla JS canvas (existing `PX` helpers).

**Spec:** `docs/superpowers/specs/2026-11-14-backend-pixel-coffee-design.md` (read it, especially "Calls made after
the builder check", which overrides the earlier sections).

## Global Constraints

- Three PRs to `main`, in order: PR 1 = Tasks 1-4, PR 2 = Task 5, PR 3 = Tasks 6-12. Squash merge, auto-merge armed.
- The Worker is deployed (Task 4 / Task 12) **before** the PR whose client code calls it is merged.
- Cloudflare account `86857b772da63ff1d71ef98acd440f33`; Worker `pixel-arcade-api`; D1 `pixel-arcade`, created with
  `--jurisdiction eu`.
- API base: `http://localhost:8787` when `location.hostname` is `localhost` or `127.0.0.1`, else
  `https://pixel-arcade-api.matej-hron.workers.dev`.
- CORS origins: `https://matej-hron.github.io`, `http://localhost:<any port>`, `http://127.0.0.1:<any port>`.
- Never store IP addresses, user agents, e-mails or cookies. The anonymous visitor id is never linked to a player.
- The arcade must keep working fully offline and without an account; every network call fails quietly.
- Names: `PX.cleanName` rules (A-Z, 0-9, space, 2-10 chars). Unique case-insensitively on the server.
- Passwords: the phone sends hex PBKDF2-SHA256(password, csalt, 150000 iterations, 256 bits); the server stores
  hex SHA-256(ssalt ‖ that hex string). Same for the recovery code with rsalt. The local `{salt, hash}` is never sent.
- All UI text uppercase, in the pixel font, existing colors and button style (`UI.button`, `panel`, `T`).
- Each PR bumps `VERSION` in `index.html` (minor) and `CACHE` in `sw.js` to match (`pixel-arcade-v<VERSION>`).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A phone that is offline, or an API that is down, at any account step: the local account must still work and the
   message must say what happened (NEEDS INTERNET), never a frozen "ONE MOMENT...". (Tasks 9, 10)
2. A fresh phone that logs in to an existing server account and has worse scores: the server keeps the better value,
   including for "lower is better" boards. (Task 7 test `keeps the better value`)
3. Garbage in a game's save (missing fields, strings, NaN, negative, absurd numbers): extractors skip it, never throw,
   never send it. (Task 9 browser check, Task 7 bounds tests)
4. Two kids on one phone: logging out drops the token, so the next kid can't act as the previous one. (Task 10)
5. Name collisions: the default `PLAYERnn` names will collide; register must answer NAME_TAKEN clearly and the
   account must stay usable locally. (Task 6 test, Task 10)

---

## PR 1: backend skeleton + usage pixel

### Task 1: Worker scaffold with the visit counter

**Files:**
- Create: `api/package.json`, `api/wrangler.jsonc`, `api/tsconfig.json`, `api/vitest.config.ts`,
  `api/test/apply-migrations.ts`, `api/migrations/0001_hits.sql`, `api/src/index.ts`, `api/src/hits.ts`,
  `api/test/hits.test.ts`, `api/.gitignore` (`node_modules`, `.wrangler`, `.dev.vars`)
- Modify: `.gitignore` (create at repo root if missing: `api/node_modules`, `api/.wrangler`)

**Interfaces:**
- Produces: `app` (Hono, default export `{ fetch: app.fetch, scheduled }` in `src/index.ts`); `Env` type
  `{ DB: D1Database; ADMIN_KEY: string }` in `src/index.ts`; `POST /v1/hit`; `cleanupHits(db, today: string)`.

- [ ] **Step 1: Scaffold.** Mirror `~/src/playground/deepblue/student.deepblue.cz` (package.json scripts `test`,
  `typecheck` (`tsc --noEmit`), `dev` (`wrangler dev`), `deploy` (`wrangler deploy`), `vitest.config.ts`,
  `test/apply-migrations.ts`, `tsconfig.json` without the web/jsx bits). `wrangler.jsonc`: name `pixel-arcade-api`,
  `account_id` above, `main: src/index.ts`, `compatibility_date: 2026-11-01`, `d1_databases` binding `DB` named
  `pixel-arcade` (placeholder id `00000000-0000-0000-0000-000000000000` until Task 4), `migrations_dir: migrations`,
  `triggers.crons: ["23 3 * * *"]`, `observability.enabled: true` with `logs.invocation_logs: false`. Tests bind
  `ADMIN_KEY: 'test-admin'`. `npm install`.
- [ ] **Step 2: Migration 0001.**
  `hits_daily(day TEXT, page TEXT, views INTEGER, PRIMARY KEY(day, page))`,
  `hits_uniq(day TEXT, page TEXT, vid TEXT, PRIMARY KEY(day, page, vid))`,
  `hits_country(day TEXT, country TEXT, views INTEGER, PRIMARY KEY(day, country))`. `day` is `YYYY-MM-DD` UTC.
- [ ] **Step 3: Write the failing tests** in `test/hits.test.ts` (use `SELF.fetch` from `cloudflare:test`):
  - `counts a view`: POST `/v1/hit` body `'{"p":"thief.html","v":"1.18.0","d":"abc123abc123"}'` with
    `content-type: text/plain` → 204; `hits_daily` row for today/`thief.html` has `views = 1`; second identical POST →
    `views = 2` and still one `hits_uniq` row.
  - `counts country`: request with `cf: { country: 'CZ' }` → `hits_country` CZ = 1; no country → `'XX'`.
  - `rejects junk`: page not matching `/^[a-z0-9_-]{1,24}\.html$/` (and not `''` → stored as `index.html`), vid not
    matching `/^[a-z0-9]{8,32}$/`, or body not JSON → 400, nothing written.
  - `cors`: OPTIONS from `https://matej-hron.github.io` → 204 with `access-control-allow-origin` echoing it; from
    `https://evil.example` → no allow-origin header.
  - `cleanup`: `cleanupHits(env.DB, '2026-11-14')` deletes `hits_uniq` rows older than 40 days, keeps the rest
    (`hits_daily` and `hits_country` are kept forever).
- [ ] **Step 4: Run** `cd api && npm test` → FAIL (route missing).
- [ ] **Step 5: Implement** `src/hits.ts` (`hitRoute`, `cleanupHits`) and `src/index.ts` (Hono app, `hono/cors`
  with the origin function from Global Constraints, `/v1/hit`, `scheduled` calling `cleanupHits` with today). Upserts
  with `INSERT ... ON CONFLICT DO UPDATE SET views = views + 1` and `INSERT OR IGNORE` for uniques, in one `batch`.
- [ ] **Step 6: Run** `npm test && npm run typecheck` → PASS.
- [ ] **Step 7: Commit** `Backend: Worker skeleton with the visit counter`.

### Task 2: The owner's stats page

**Files:** Create `api/src/stats.ts`, `api/test/stats.test.ts`. Modify `api/src/index.ts`.

**Interfaces:**
- Consumes: tables from Task 1, `Env.ADMIN_KEY`.
- Produces: `GET /stats?key=…` (HTML); `adminOk(c): boolean` (constant-time compare of `key` query or
  `Authorization: Bearer`) exported from `src/stats.ts` for Task 8.

- [ ] **Step 1: Failing tests:** `GET /stats` without/with wrong key → 401; with `key=test-admin` → 200,
  `content-type` html, contains `PIXEL ARCADE STATS`, the seeded page name `thief.html`, its views and uniques, and
  country `CZ`; response has `cache-control: no-store` and `x-robots-tag: noindex`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** a plain server-rendered page (escaped values, no scripts needed): last 30 days, per day
  total views + unique visitors (distinct vid across pages); per page totals over 30 days (views, uniques); top 15
  countries. Readable on a phone (`<meta viewport>`, one column, tables scroll horizontally).
- [ ] **Step 4: Run** `npm test && npm run typecheck` → PASS.
- [ ] **Step 5: Commit** `Backend: stats page for the owner`.

### Task 3: The pixel in the arcade

**Files:** Modify `common.js` (new `Api` section after the profile section, export in the `return {…}` at the
bottom), `index.html` (`PHONE_KEYS`, `POLICY`, `VERSION`), `sw.js` (`CACHE`), `README.md` (new "Backend" section
with run/deploy/stats instructions, and a "Usage numbers" paragraph).

**Interfaces:**
- Produces: `PX.Api = { base: string, call(method: string, path: string, body?: object, token?: string): Promise<{ok: boolean, status: number, data: any}> }`
  (`status` 0 on network error/timeout 8 s; never throws); `PX.Api.hit()` runs once on load.

- [ ] **Step 1: Implement.** `Api.hit()`: skip when `location.hostname` is localhost/127.0.0.1 unless
  `localStorage['pixelArcade.hitLocal'] === '1'`, or when `navigator.onLine === false`; page = last path segment or
  `index.html`; `v` = the page's top-level `const VERSION` (classic scripts share the global lexical scope, so
  `typeof VERSION === 'string' ? VERSION : undefined` works when `hit()` runs on the `load` event, after the game's
  script); `d` = `pixelArcade.vid`
  (create: 16 chars `[a-z0-9]` from `crypto.getRandomValues`). Send with
  `navigator.sendBeacon(base + '/v1/hit', new Blob([json], {type: 'text/plain'}))`, falling back to
  `fetch(…, {method:'POST', keepalive:true, mode:'cors'})`.
- [ ] **Step 2:** `index.html`: add `'pixelArcade.vid'` and `'pixelArcade.hitLocal'` to `PHONE_KEYS`; add a POLICY
  line: `'THE ARCADE COUNTS VISITS WITHOUT KNOWING WHO YOU ARE: WHICH GAME AND WHICH COUNTRY. NOTHING ABOUT YOU.'`
  (check it still fits the policy screen; shorten other lines if needed). Bump `VERSION` → `2.44.0`, `CACHE` →
  `pixel-arcade-v2.44.0`.
- [ ] **Step 3: Verify in a browser.** `cd api && npx wrangler d1 migrations apply pixel-arcade --local &&
  npm run dev`; serve the site with `python3 -m http.server 8000` from the repo root; open
  `http://localhost:8000/index.html` with `pixelArcade.hitLocal = '1'`, then `thief.html`. Check
  `npx wrangler d1 execute pixel-arcade --local --command "select * from hits_daily"` shows both pages, and
  `http://localhost:8787/stats?key=<.dev.vars ADMIN_KEY>` lists them. Offline mode in devtools: no console errors.
- [ ] **Step 4: Commit** `Arcade 2.44.0: count visits (anonymous)`.

### Task 4: Provision, deploy, PR 1

- [ ] **Step 1:** `npx wrangler d1 create pixel-arcade --jurisdiction eu` → put the id into `wrangler.jsonc`.
- [ ] **Step 2:** `npx wrangler d1 migrations apply pixel-arcade --remote`; generate `ADMIN_KEY`
  (`openssl rand -hex 24`), `npx wrangler secret put ADMIN_KEY`; keep it for the final report, never commit it.
- [ ] **Step 3:** `npm test && npm run typecheck && npm run deploy`.
- [ ] **Step 4: Smoke test:** `curl -i -X POST https://pixel-arcade-api.matej-hron.workers.dev/v1/hit -H
  'content-type: text/plain' -H 'origin: https://matej-hron.github.io' -d '{"p":"smoke.html","d":"smoketest0001"}'`
  → 204 with allow-origin; `/stats?key=…` shows `smoke.html`; then delete the smoke rows with `wrangler d1 execute
  --remote`.
- [ ] **Step 5:** Commit the D1 id, push, open PR 1 (`Arcade 2.44.0: backend skeleton and anonymous visit counter`),
  `gh pr merge --auto --squash`.

## PR 2: buy me a coffee

### Task 5: Coffee button behind a grown-ups gate

**Files:** Modify `index.html` (constant near `VERSION`, SETTINGS panel, new `coffee` screen, screen dispatch,
`PX.Pad` menu predicate), `sw.js`, `README.md`.

**Interfaces:** Produces `COFFEE_URL` (string, `''` until the owner has a page) and screen `'coffee'`.

- [ ] **Step 1: Implement.** SETTINGS: grow the panel and add a full-width **BUY ME A COFFEE** button (cup icon via
  `PX.drawIcon`, brown accent `#c8843a`) under PHONE CONTROLLERS, only when `COFFEE_URL`. The `coffee` screen: BACK,
  title `FOR GROWN-UPS`, text `THE ARCADE IS FREE. IF A GROWN-UP WANTS TO SAY THANKS, THEY CAN BUY THE MAKER A
  COFFEE.`, a random question `a × b = ?` with a, b in 6..9 and four different answers (one right) as buttons. Right →
  `window.open(COFFEE_URL, '_blank', 'noopener')` and back to SETTINGS; wrong → `NOT QUITE. ASK A GROWN-UP!` and a new
  question. `PX.Pad` menu predicate includes `'coffee'`.
- [ ] **Step 2: Verify in a browser:** with `COFFEE_URL = ''` the button is absent; with a test URL it appears, a
  wrong answer doesn't open anything, the right answer opens a new tab; works with keyboard/controller navigation.
  Set it back to `''` unless the owner gave a URL.
- [ ] **Step 3:** Bump `VERSION` 2.45.0 / `CACHE`, README "Buy me a coffee" section (how to set `COFFEE_URL`).
- [ ] **Step 4:** Commit `Arcade 2.45.0: buy me a coffee (for grown-ups)`, PR 2 from a branch off `main`, auto-merge.

## PR 3: accounts + leaderboards

### Task 6: Server accounts

**Files:** Create `api/migrations/0002_accounts.sql`, `api/src/auth.ts`, `api/src/accounts.ts`,
`api/src/names.ts`, `api/test/accounts.test.ts`. Modify `api/src/index.ts`.

**Interfaces:**
- Produces: `requirePlayer` Hono middleware setting `c.get('player')` = `{id: string, name: string}` (401
  `{error:'AUTH'}` otherwise); `sha256hex(s: string): Promise<string>`; `newToken(): string` (64 hex);
  `cleanName(v: string): string` and `badName(name: string): boolean` in `names.ts`.
- Endpoints (JSON in/out, errors `{error: CODE}`):
  - `POST /v1/prelogin {name}` → `{csalt, rsalt}` | 404 `NO_PLAYER`
  - `POST /v1/register {id, name, avatar:{shape,color}, csalt, pw, rsalt, rpw}` → 201 `{token}` |
    409 `NAME_TAKEN` | 409 `ID_TAKEN` | 422 `NAME_BAD` | 400 `BAD`
  - `POST /v1/login {name, pw}` → `{token, id, name, avatar}` | 401 `WRONG` | 404 `NO_PLAYER` | 429 `LOCKED`
  - `POST /v1/reset {name, rpw, csalt, pw}` → `{token}` (deletes the player's other sessions) | 401 `WRONG` | 429
  - auth: `GET /v1/me` → `{id, name, avatar}`; `PUT /v1/me {name?, avatar?}` → `{id, name, avatar}` | 409/422;
    `POST /v1/password {csalt, pw}` → 204 (keeps this session, deletes the others); `DELETE /v1/me` → 204 (player,
    sessions, scores); `DELETE /v1/session` → 204.
- Validation: id `/^[1-9][0-9]{5}$/`; salts and pw/rpw 32 or 64 hex chars; avatar shape `/^[a-z]{2,12}$/`, color int
  0..9; name = `cleanName` result of length ≥ 2 and equal to the input.

- [ ] **Step 1: Migration 0002:** `players(id TEXT PK, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE, shape TEXT,
  color INTEGER, csalt TEXT, ssalt TEXT, pw TEXT, rsalt TEXT, rssalt TEXT, rpw TEXT, created TEXT, seen TEXT)`;
  `sessions(token_hash TEXT PK, player TEXT NOT NULL, created TEXT)` + index on player;
  `scores(player TEXT, board TEXT, value REAL, updated TEXT, PRIMARY KEY(player, board))` + index `(board, value)`;
  `login_fail(name_key TEXT PK, count INTEGER, since INTEGER)`. `name_key` = upper-cased name with spaces removed.
- [ ] **Step 2: Failing tests** (`accounts.test.ts`), one per behavior:
  `register then login`, `register NAME_TAKEN ignoring case and spaces`, `register ID_TAKEN`, `register NAME_BAD`
  (a word from the list, e.g. `KURVA`, and `FUCK1`), `register BAD on malformed hex`, `prelogin returns the salts`,
  `login WRONG`, `login locks after 10 failures for 15 minutes` (11th → 429 even with the right pw; a success resets
  the counter), `reset with recovery code drops other sessions`, `me needs a token`, `PUT me renames, NAME_TAKEN`,
  `password change keeps this session, drops others`, `DELETE me removes player, sessions and scores`,
  `DELETE session logs out`, `server stores only sha256(ssalt+pw)` (the `pw` column ≠ the sent pw).
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement** (rude-word list in `names.ts`: ~40 English and Czech words,
  matched as substrings of `name_key`; constant-time compare for hashes; `seen` updated by `requirePlayer` at most
  once per day). **Step 5: Run** `npm test && npm run typecheck` → PASS.
- [ ] **Step 6: Commit** `Backend: server accounts`.

### Task 7: Scores and leaderboards

**Files:** Create `api/src/boards.ts`, `api/src/scores.ts`, `api/test/scores.test.ts`. Modify `api/src/index.ts`.

**Interfaces:**
- Produces: `BOARDS: Record<string, {better: 'higher'|'lower', min: number, max: number, tracks: boolean}>` keyed by
  game; `boardRule(board: string)` → rule | null: an exact key wins (`bike:free`, `moto:free` are explicit entries,
  `better: 'higher'`); otherwise `game` (when `!tracks`) or `game:<track>` with track `/^[a-z0-9_]{1,24}$/` (when
  `tracks`).
- `POST /v1/scores {scores: [{b: string, v: number}]}` (auth, max 60 items) → `{saved: number}`; invalid items are
  skipped, not fatal. Keep-the-better upsert:
  `INSERT … ON CONFLICT DO UPDATE SET value = excluded.value, updated = excluded.updated WHERE excluded.value > value`
  (or `<` for lower).
- `GET /v1/boards/:board?page=0` → `{board, rows: [{rank, name, shape, color, value, me?: true}], me: {rank, value} | null}`
  top 50 (page of 10 via `page` 0..4), ties broken by earlier `updated`; `me` only with a valid token. Unknown board
  → 404. Response `cache-control: public, max-age=30` only when no Authorization header.
- Board table (min/max are sanity bounds; times in seconds): stars higher 0..10 000 000; thief higher 0..36 000;
  racer lower 5..600; skygp:* lower 5..600; bike:* / moto:* lower 3..3600; bike:free / moto:free higher 0..1 000 000;
  ski:* lower 3..3600; heist:* lower 5..7200; skate higher 0..10 000 000; horde:* higher 0..600; defense:* higher
  0..10 000; hook higher 0..1 000 000; runs higher 0..10 000 000; miner higher 0..1 000 000; snake higher
  0..1 000 000; hoops higher 0..100 000; cook higher 0..100 000 000; fish higher 0..100 000 000; pong, boxfight,
  wings higher 0..1 000 000; football higher 0..10 000.

- [ ] **Step 1: Failing tests:** `keeps the better value` (higher board: 50 then 40 → 50; then 60 → 60; lower board
  `racer`: 30.5 then 31 → 30.5; then 29 → 29), `rejects out-of-range and unknown boards` (`racer` 2, `nosuch`,
  `thief:x`, NaN/string → skipped, `saved` counts only good ones), `track boards` (`skygp:t1` ok, `skygp` without
  track → skipped), `board order and ranks` (higher desc / lower asc, ties by updated), `me row and me flag with
  token`, `no ids in rows`, `cache header only without auth`, `scores need a token`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Backend: scores and leaderboards`.

### Task 8: Moderation on the stats page

**Files:** Modify `api/src/stats.ts`, `api/test/stats.test.ts`.

- [ ] **Step 1: Failing tests:** stats page lists the newest 50 players (name, id, created) with RENAME and DELETE
  forms; `POST /stats/players/:id/rename?key=…` sets name to `'P' + id` (and `name_key`); `POST
  /stats/players/:id/delete?key=…` deletes player, sessions, scores; both 401 without key; both redirect (303) back
  to `/stats?key=…`.
- [ ] **Step 2-4:** Run → FAIL, implement (plain HTML forms), run → PASS.
- [ ] **Step 5: Commit** `Backend: rename or delete players from the stats page`.

### Task 9: Client API helpers and score sync

**Files:** Modify `common.js` (extend the `Api` section; new `Scores` section; export `Scores`).

**Interfaces:**
- Consumes: Task 3 `PX.Api.call`; Task 6/7 endpoints.
- Produces:
  - `PX.Api.pbkdf2(text: string, saltHex: string): Promise<string>` (150 000 iterations, SHA-256, 256 bits, hex).
  - `PX.Api.session(): {id, tok} | null` reads the logged-in account's token from `pixelArcade.accounts`
    (`{cur, list:[{id, tok?, srv?}]}`), so game pages can sync too.
  - `PX.Scores.GAMES`: array in arcade order, `{game, name, unit: 'time'|'m'|'$'|'coins'|'count'|'stars'|'waves'|'len'|'pts', boards(save: object) → [{b, v, label?}]}`
    reading the save key from the spec's board table; `label` is the track/level display name from that game's own
    track table (look them up in each game file; fallback: the key upper-cased).
  - `PX.Scores.collect(): [{b, v}]` (all games; skips anything not a finite number within the server bounds
    copied from Task 7's table — keep a `BOUNDS` copy in common.js).
  - `PX.Scores.sync(): Promise<void>`: needs `session()` and online; posts only boards whose value is better than
    `pixelArcade.sentScores[<id>][b]`; on 200 records what was sent; on 401 calls `PX.Api.onAuthLost()` (set by
    `index.html`, default: remove `tok` from the account record). Runs once ~3 s after load on every page.
  - `PX.Scores.format(game, v): string` (time `m:ss.d`, `1 234 M`, `$1 234`, `1 234 COINS`, `★ 1 234`…).
- [ ] **Step 1: Implement.** **Step 2: Verify in a browser** (local `wrangler dev`, a test account made by curl
  against local API with a token pasted into `pixelArcade.accounts`): load `index.html` with real-looking saves for 3
  games (one lower-is-better, one per-track, one with a garbage field) → `scores` table has exactly the expected
  rows; reload → no second POST (devtools network); improve one save value → only that board posts.
- [ ] **Step 3: Commit** `Arcade: sync game bests to the leaderboard`.

### Task 10: Accounts in the arcade use the server

**Files:** Modify `index.html` (`Account`, `drawAccount`, `POLICY`, profile EDIT save path, `PHONE_KEYS` if needed).

**Interfaces:**
- Consumes: Task 9 helpers. Account record gains `srv?: true`, `tok?: string`, `csalt?: string`.
- Produces: `Account.server` helpers: `register(a, password, code) → 'ok'|'NAME_TAKEN'|'ID_TAKEN'|'NAME_BAD'|'OFFLINE'`,
  `serverLogin(name, password) → {ok, data, error}`; screen modes `'join'` (JOIN THE LEADERBOARD: password →
  register, then the new recovery code via the existing `'code'` mode) and `'remote'` (LOG IN FROM ANOTHER PHONE:
  name + password).

- [ ] **Step 1: Implement** the flows exactly as the spec's "Accounts in the arcade" plus "Calls made after the
  builder check" 1, 2, 4, 5:
  - create → local account as today, then `register` with the same password and the shown code (csalt/rsalt fresh).
    Any failure → message under the code screen (`NOT ON THE LEADERBOARD YET: …`), local account fine.
  - login → local hash ok: if `srv` get a token with `serverLogin`; if not `srv` register silently (new recovery
    code → show `'code'` mode before reload). Local hash wrong and `srv` and online → `serverLogin`; ok → update local
    `salt/hash`, continue.
  - `ID_TAKEN` → new random ID for this account (also `profile.id`), retry once.
  - logout → `DELETE /v1/session` (fire and forget) and delete `tok` before stashing.
  - change / delete on a `srv` account → server first (`OFFLINE` → `THIS NEEDS INTERNET.`), then local.
  - forgot on a `srv` account → `/v1/prelogin` + `/v1/reset`, then local hash updated.
  - remote login: the "progress would be lost" rule from call 4; on success add `{id, name, avatar, salt, hash,
    rsalt, rhash, srv: true, tok, csalt}` (rsalt/rhash: hash of a random code nobody knows, so local FORGOT routes to
    the server), restore as a new player (empty progress), reload.
  - On arcade load with a token: `GET /v1/me` → copy name/avatar into profile + record if different; 401 →
    `onAuthLost` (drop `tok`); a later login answering `NO_PLAYER` → `srv` removed.
  - EDIT save → `PUT /v1/me` when `tok`; `NAME_TAKEN` → show `NAME TAKEN ON THE LEADERBOARD` on the profile screen.
  - YOUR ACCOUNT (`'menu'`) shows `ON THE LEADERBOARD ✓` or the JOIN THE LEADERBOARD button.
  - POLICY rewritten (≤ 8 lines that fit): accounts are kept on our server too (ID, nickname, avatar, a scrambled
    password, best scores); log in on any phone (progress stays on each phone for now); DELETE ACCOUNT removes it
    everywhere; no e-mail, recovery code is the only way back; friends and gifts still via ntfy.sh; anonymous visit
    counting; nickname not real name, don't reuse a password.
- [ ] **Step 2: Verify in a browser** against local `wrangler dev`, each path: new account online and offline; JOIN;
  name taken; log out/in (token dropped and re-made); wrong local password but right server password; remote login on
  a fresh profile (with stars → refused with the message; empty → works); change password; forgot via server; delete.
  Check `sessions` and `players` rows after each.
- [ ] **Step 3: Commit** `Arcade: accounts on the server`.

### Task 11: Leaderboard screen

**Files:** Modify `index.html` (home button, `drawLeaders`, screen dispatch, `PX.Pad` predicate and LB/RB).

- [ ] **Step 1: Implement** per the spec's "Leaderboard screen": home button `TOP` with a trophy icon left of
  FRIENDS (`fx - 80`), screen `'leaders'`; state `{gi, ti, page, data, busy, err}`; fetch
  `GET /v1/boards/<b>?page=<n>` with the token when present; the board list per game comes from the boards the game's
  `GAMES` entry knows (for track games: the tracks from its table, not only the ones the player has); rows: rank,
  avatar (`PX.drawAvatar` with `{shape, color}`), name, `PX.Scores.format`; your row in yellow; footer YOU row / `MAKE
  AN ACCOUNT TO BE ON THE LEADERBOARD` (button → `Account.open()`) / `NO INTERNET` / `NOBODY YET. BE THE FIRST!`.
  Opening the screen runs `PX.Scores.sync()` first.
- [ ] **Step 2: Verify in a browser** with seeded data (≥ 25 players on one board): paging, game and track switching,
  controller LB/RB and B, narrow (360 px) and wide windows, offline message.
- [ ] **Step 3: Commit** `Arcade: global leaderboards`.

### Task 12: Release PR 3

- [ ] **Step 1:** `VERSION` 2.46.0 (or next free), `CACHE`; README: Leaderboards section, Accounts section updated
  (server, log in on any phone, what is stored), Backend section (endpoints, moderation).
- [ ] **Step 2:** `cd api && npm test && npm run typecheck`; `npx wrangler d1 migrations apply pixel-arcade --remote`;
  `npm run deploy`; smoke: register a throwaway account by curl, post a score, read the board, delete it.
- [ ] **Step 3:** Push, PR 3 (`Arcade 2.46.0: accounts on the server and global leaderboards`), auto-merge.
