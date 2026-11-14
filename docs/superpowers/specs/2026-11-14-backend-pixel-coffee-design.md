# Pixel Arcade: backend phase 1, usage pixel, buy me a coffee

Date: 2026-11-14 · Status: approved approach (A), order agreed with the owner

## Why

Pixel Arcade (this repo, served by GitHub Pages at https://matej-hron.github.io/mouse-thief/) has no server. Online play
uses PeerJS and public TURN relays; friends, gifts, invites and "is this ID a player" go through ntfy.sh; accounts live
on one phone only. The consequences the owner cares about:

- There is no global leaderboard. Mouse Thief shows only friends you have played with; other games show nothing.
- You can't log in on another phone. A player is one browser.
- The owner has no idea how many people play, or which games.
- There is no way for a grown-up to say thanks with money.

The owner wants to start simple and improve over time.

## Three projects, three PRs, in this order

1. **Backend skeleton + usage pixel**: Cloudflare Worker + D1; every page counts a visit.
2. **Buy me a coffee**: a button behind a grown-ups gate.
3. **Backend phase 1**: server accounts (nickname + password) and global leaderboards for every game.

Each one is a separate PR to `main`. PR 1 must be deployed before PR 3's client code goes live.

## Goals

- Global leaderboards: for every game, the best players by that game's BEST, with their nickname and avatar, always
  up to date (a new best appears the next time any arcade page loads online).
- Accounts on the server: nickname + password, log in on any phone, reset with the existing recovery code.
- Usage numbers: visits and unique players per day, per game, per country. Viewable by the owner on one page.
- A voluntary "buy me a coffee" link that kids can't open by accident.

## Non-goals (phase 1)

- Moving game progress between phones (★ wallet, skins, clubs, saves). Logging in on a new phone gives you your name,
  ID, avatar and your leaderboard entries, but you start the games from zero there. That's phase 2 ("save sync").
- Replacing PeerJS or ntfy.sh (friends, gifts, invites). Later phases.
- Server-checked scores. Scores are reported by the phone; the server only rejects impossible values.
- Moving the site off GitHub Pages.

## Anti-goals

- Breaking anything that works offline today. The arcade must stay fully playable with no internet and no account.
- Losing anyone's local progress or local accounts.
- Collecting personal data from kids: no e-mail, no real names, no IP addresses kept, no cookies, no third-party trackers.
- A coffee button a kid can tap into a payment page.

## Approaches considered

- **A. Separate Worker API, site stays on GitHub Pages (picked).** Nothing about the site moves. Cost: cross-origin
  calls (CORS) and a bearer token in localStorage instead of a cookie.
- B. Move the arcade onto the Worker (site + API on one origin). Rejected for now: localStorage is per origin, so every
  player would lose their saves, local accounts and installed PWA unless we built a migration.
- C. Hosted BaaS (Firebase, Supabase). Rejected: the owner uses Cloudflare elsewhere; free tier covers this easily.

For the pixel: Cloudflare Web Analytics was the first idea, but it needs a site token from the dashboard (the wrangler
OAuth token can't create one) and only counts page views. A counter in our own Worker needs no extra setup, can count
custom events later (e.g. online connection failures), and keeps the data in our D1. Picked: our own counter.

For password hashing: the arcade already hashes passwords on the phone with PBKDF2-SHA256, 150 000 iterations.
Workers cap PBKDF2 at 100 000 iterations and the free plan has a 10 ms CPU limit, so the heavy hashing stays on the
phone: the phone sends the PBKDF2 output (with a per-account salt the server hands out), and the server stores only
SHA-256(server salt ‖ that output). A leaked database can't be brute-forced without the PBKDF2 work.

## Decided

### Backend (all PRs)

- Code in `api/` in this repo: TypeScript Worker, Hono, Zod, Vitest with `@cloudflare/vitest-pool-workers`, the same
  stack as `~/src/playground/deepblue/student.deepblue.cz`. Own `package.json`; the site itself stays build-free.
- Worker name `pixel-arcade-api` on the owner's personal Cloudflare account (`86857b772da63ff1d71ef98acd440f33`,
  put explicitly in `wrangler.jsonc`), URL `https://pixel-arcade-api.matej-hron.workers.dev`.
- D1 database `pixel-arcade`, created with `--jurisdiction eu` (kids' data). Migrations in `api/migrations`.
- Secret `ADMIN_KEY` (random, set with `wrangler secret put`), for the owner's pages and admin calls.
- CORS: allow `https://matej-hron.github.io`, `http://localhost:*`, `http://127.0.0.1:*`.
- Deployed by hand (`npm run deploy` in `api/`), documented in the README. No CI deploy in phase 1.
- `common.js` gets `PX.Api`: the base URL (`http://localhost:8787` when the page is on localhost, else the workers.dev
  URL), a `fetch` wrapper with a timeout, JSON and the logged-in token. Every call fails quietly when offline.

### PR 1: usage pixel

- `common.js`, once per page load: `navigator.sendBeacon(API + '/v1/hit', JSON {p: page file name, v: page VERSION
  if known, d: anonymous visitor id})`, sent as `text/plain` so no CORS preflight. Skipped on localhost.
- The anonymous visitor id is a random string in `pixelArcade.vid`, separate from the player ID and never linked to
  it. It belongs to the phone (add it to `PHONE_KEYS` in `index.html`, so logging out doesn't reset it).
- Server stores: per day + page: views; per day + page + visitor: one row (for uniques), deleted after 40 days by a
  daily cron; per day + country (from `request.cf.country`): views. No IP, no user agent.
- `GET /stats?key=ADMIN_KEY`: a plain HTML page, last 30 days: total visits and unique players per day, a table of
  pages (games) by visits and uniques, top countries. Phase 3 adds player moderation to it.
- PRIVACY AND POLICY gets a line: the arcade counts visits anonymously (which game, which country), nothing about you.

### PR 2: buy me a coffee

- A `COFFEE_URL` constant in `index.html`. While it's empty the button doesn't show, so the PR can merge before the
  owner has a page.
- SETTINGS gets a **BUY ME A COFFEE** button (coffee-cup pixel icon). It opens a grown-ups screen: "THE ARCADE IS
  FREE. IF A GROWN-UP WANTS TO SAY THANKS, THEY CAN BUY THE MAKER A COFFEE." plus a gate: a multiplication question
  (e.g. 7 × 8) with four answers. Right answer → `window.open(COFFEE_URL, '_blank', 'noopener')`. Wrong → back.
- Works with the controller (PX.Pad moves between the buttons) like the rest of SETTINGS.
- README: a short section.

### PR 3: accounts + leaderboards

**Server data**

- `players`: id (the existing 6-digit ID, primary key), name (unique, case-insensitive), avatar shape + color,
  csalt (client salt, hex), pw (SHA-256 of server salt ‖ client PBKDF2 output), ssalt, rsalt + rpw (same for the
  recovery code), created, last seen.
- `sessions`: SHA-256 of a random 32-byte token, player id, created. No expiry; logout deletes it.
- `scores`: player id, board, value, updated. Primary key (player, board). Only improvements are stored.
- Login throttling: after 10 failed logins for one name in 15 minutes, that name is locked for 15 minutes.

**API (v1)**

- `POST /v1/prelogin {name}` or `{id}` (exactly one) → `{csalt, rsalt}` for that player (404 if none).
- `POST /v1/register {id, name, avatar, csalt, pw, rsalt, rpw}` → `{token}`. 409 `NAME_TAKEN` / `ID_TAKEN`. 429 `SLOW_DOWN` when sign-ups come too fast (rate limit).
  Name filtered: `PX.cleanName` rules + a small English/Czech rude-word list → 422 `NAME_BAD`.
- `POST /v1/login {name | id, pw}` (exactly one of name or id) → `{token, id, name, avatar}`. 429 `LOCKED` for 15 minutes from the 10th failure.
- `POST /v1/reset {name | id, rpw, csalt, pw}` (exactly one of name or id) → `{token, id}` (recovery code → new password; old sessions dropped).
- With `Authorization: Bearer <token>`: `PUT /v1/me {name?, avatar?}`, `POST /v1/password {pw, csalt}`,
  `DELETE /v1/me` (deletes player, sessions and scores), `DELETE /v1/session`, `POST /v1/scores {scores: [{b, v}]}`.
- `GET /v1/boards/:board?page=<0-4>` → a page of 10 (top 50 in all) `{board, rows: [{rank, name, shape, color, value,
  me?}], me}`: no player ids; with a token, `me: true` on your own row and `me: {rank, value}` (else `null`). Public;
  an answer without a token may be browser-cached for 30 s (`Cache-Control: public, max-age=30`, `Vary: Authorization`).
- Admin (ADMIN_KEY): the `/stats` page lists the 50 newest players with RENAME-TO-PLAYERnnnnnn and DELETE buttons.

**Boards.** A board id is `game` or `game:track`. The server knows each game's direction (higher or lower is better)
and sane min/max, and rejects other values (422) or unknown boards. One table, shared by server and client, lives in
`api/src/boards.ts`; the client copy in `common.js` (`PX.Scores.GAMES`) also has the display name, units and how to
read the value out of the game's save. The list:

| game | board(s) | value from the save | better |
|---|---|---|---|
| stars | `stars` | `mouseThief.save.v1`.totalEarned (★ earned ever) | higher |
| thief | `thief` | `mouseThief.save.v1`.bestTime (s) | higher |
| racer | `racer` | `pixelGP.save`.bestLap (s) | lower |
| skygp | `skygp:<track>` | `pixelSkyGP.save`.best[track] (s) | lower |
| bike | `bike:<trail>`, `bike:free` | `pixelBikeRun.save`.best[trail] (s), .freeBest (m) | lower / higher |
| moto | `moto:<track>`, `moto:free` | `pixelMoto.save` same shape | lower / higher |
| ski | `ski:<map_level>` | `pixelSki.save`.best[runKey] (s) | lower |
| heist | `heist:<level>` | `pixelHeist.save`.best[n] (s) | lower |
| skate | `skate` | `pixelSkate.save`.bestCombo | higher |
| horde | `horde:<map>` | `pixelHorde.save`.best[map] (s) | higher |
| defense | `defense:<map>` | `pixelDefense.save`.maps[id].endless (waves) | higher |
| hook | `hook` | `pixelHook.save`.endless / 10 (m, floored) | higher |
| runs | `runs` | `pixelRuns.save`.best (m) | higher |
| miner | `miner` | `pixelMiner.save`.maxDepth (m) | higher |
| snake | `snake` | `pixelSnake.io`.best (length) | higher |
| hoops | `hoops` | `pixelHoops.save`.best (points) | higher |
| cook | `cook` | `pixelCook.save`.best ($) | higher |
| fish | `fish` | `deepCatch.save`.best (coins) | higher |
| pong | `pong` | `pixelPong.save`.wins | higher |
| boxfight | `boxfight` | `pixelBoxFight.save`.wins | higher |
| wings | `wings` | `pixelWings.save`.wins | higher |
| football | `football` | `pixelFootball.save.v1`.club.trophies | higher |

Track keys and their display names come from each game's own track/level tables (builder looks them up).

**Syncing scores: central, no game edits.** Every page loads `common.js`. On load (and when the leaderboard opens),
if a server account is logged in on this phone and we're online, `PX.Scores.sync()` reads every game's save from
localStorage, extracts the board values, compares them with the last values sent (`pixelArcade.sentScores`, kept per
account), and posts only the improved ones. The server keeps the better of old and new, so a fresh phone with low
scores never overwrites a record. No game file changes; game VERSIONs stay as they are.

**Accounts in the arcade (`Account` in `index.html`)**

- An account record gets `srv` (registered on the server) and `tok` (session token). They live in
  `pixelArcade.accounts`, which is a phone key, so they survive LOG OUT / LOG IN stashing.
- MAKE AN ACCOUNT / NEW ACCOUNT: after the local account is made, register it on the server with the same password
  and recovery code. Offline or failed → the local account still works; YOUR ACCOUNT then shows a **JOIN THE
  LEADERBOARD** button (asks the password once and registers). `NAME_TAKEN` → "THAT NAME IS TAKEN. CHANGE IT IN
  EDIT, THEN JOIN THE LEADERBOARD." `ID_TAKEN` → first log in to that ID with the same password: if it works, it is
  this very account (an earlier answer got lost), which is signed in and keeps its recovery code. Only a wrong
  password (somebody else's ID) picks a new random ID and retries once (rare; the old ID's friends links break); if
  that fails too, the account gets its old ID back.
- Existing local accounts: the next LOG IN with password registers them silently (or logs in, if `srv` and no token).
  The account that is logged in now (who never retypes the password) uses JOIN THE LEADERBOARD.
- **LOG IN FROM ANOTHER PHONE** (new button on WHO IS PLAYING? and next to MAKE AN ACCOUNT): name + password →
  prelogin + login → a new local account with the server's id, name and avatar, a local hash of the same password,
  and empty progress (phase 1). Max 6 accounts per phone still applies.
- FORGOT PASSWORD for a server account goes through `/v1/reset` (needs internet, works on any phone).
- CHANGE PASSWORD and DELETE ACCOUNT on a server account need internet and update the server too. EDIT (name, avatar)
  pushes to `PUT /v1/me`; if the name is taken the local change stays and EDIT shows "NAME TAKEN ON THE LEADERBOARD".
- LOG OUT: drop the token locally and call `DELETE /v1/session` (best effort).
- POLICY: rewritten for server accounts (what is stored: ID, nickname, avatar, scrambled password, best scores;
  DELETE ACCOUNT removes it from the server and this phone, other phones keep their copy until deleted there; still
  no e-mail, use a nickname, don't reuse a password).

**Leaderboard screen (`index.html`)**

- A trophy button on the home screen next to FRIENDS.
- `◀ GAME ▶` picker (STARS EARNED first, then the games in arcade order), and `◀ TRACK ▶` when the game has several boards.
- Top 10 rows (rank, avatar, name, formatted value; your row highlighted), MORE pages up to 50, then a YOU row with
  your rank, or "MAKE AN ACCOUNT TO BE ON THE LEADERBOARD" (no account) / "JOIN THE LEADERBOARD IN YOUR ACCOUNT" (an
  account that is not on the board yet; "LOG IN TO …" when it is on the server but has no token) / "NO INTERNET".
- Controller: LB/RB switch game, PX.Pad moves between buttons, B back. Same look as FRIENDS.
- Values formatted per game: times as m:ss.d, metres, $, coins, counts.

**Release.** Bump `VERSION` in `index.html` and `CACHE` in `sw.js` in each PR. README gets sections for the backend
(how to run, deploy, the admin page), the pixel, the coffee button and leaderboards; Accounts and Privacy sections are
updated.

## Calls made after the builder check (they override anything above that disagrees)

1. **The server secret is separate from the phone's hash.** The phone's `{salt, hash}` in `pixelArcade.accounts` is
   never sent. For the server the phone derives PBKDF2(password, `csalt`) with its own `csalt` (a fresh salt made at
   register, handed back by `/v1/prelogin`). Same for the recovery code with `rsalt`.
   Existing local accounts can't bring their recovery code (only its hash exists), so registering an existing account
   (silent at LOG IN, or JOIN THE LEADERBOARD) makes a **new recovery code**, shows it once like MAKE AN ACCOUNT
   does, and replaces the local `rsalt`/`rhash` too: one code for both.
2. **Only the logged-in account holds a token.** LOG OUT drops `tok` (and calls `DELETE /v1/session`); LOG IN gets a
   new one with the typed password. So the shared accounts list never holds another kid's working token.
3. **Boards don't expose player IDs.** Rows are `{rank, name, avatar, value}` plus `me: true` on your own row when
   the request carries your token. The top list (without `me`) may be edge-cached; your own rank comes uncached.
4. **LOG IN FROM ANOTHER PHONE never throws progress away.** On WHO IS PLAYING? the current player is already stashed,
   so it just adds an account. On a phone with no accounts: if the player here has nothing (★0 earned and no game
   save keys), they are replaced; otherwise the arcade says "FIRST MAKE AN ACCOUNT FOR THE PLAYER ON THIS PHONE, SO
   THEIR STARS AND GAMES ARE KEPT" and goes to MAKE AN ACCOUNT.
5. **For a server account, the server is the truth for name, avatar, password and existence.**
   - New `GET /v1/me` → `{id, name, avatar}`, called on arcade load with the score sync. A changed name or avatar
     (e.g. renamed by the admin) is copied into the local profile and account record.
   - A 401 drops the token. If `/v1/login` then says the player doesn't exist (deleted by the admin or on another
     phone), the local account sets `srv: false` and keeps working locally; JOIN THE LEADERBOARD is offered again.
   - LOG IN with a password that fails the local hash: if online and `srv`, try the server; if the server accepts it,
     update the local hash (the password was changed on another phone).
   - Admin rename gives `P` + ID (7 characters, fits `PX.cleanName`'s 10).
6. **The STARS board is stars earned, ever:** `mouseThief.save.v1`.totalEarned, which only goes up (spending, bets and
   gifts don't lower it), so "keep the better" works. Shown as "★ EARNED".
7. **Deploying:** the owner said to work independently and wrangler is logged in to the personal account, so the
   builder creates the EU D1, sets `ADMIN_KEY`, applies migrations and deploys the Worker before merging the PR whose
   client code needs it. The ADMIN_KEY goes to the owner in the final report (not committed).
8. Stored server accounts log in by player id (a nickname can change on another phone); only LOG IN FROM ANOTHER PHONE uses the nickname.

## Left to the builder

- Exact screen layouts, icons and wording within the arcade's style (uppercase pixel font, existing colors).
- Track/level display names per game.
- The rude-word list.
- How the `/stats` page looks (plain, readable on a phone).
- Test structure. API: Vitest against the local D1, covering every endpoint, validation, throttling, CORS and the
  "keep the better score" rule. Client: there is no test setup; verify in a browser against `wrangler dev`.
