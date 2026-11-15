import type { Context } from 'hono';
import type { Env } from './index';
import { deleteIdea, ideaText, REPLY_MAX, STATUSES } from './ideas';
import type { Status } from './ideas';
import { deletePlayer } from './players';
import { nameKey } from './names';

type Ctx = Context<{ Bindings: Env }>;

const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

const givenKey = (c: Ctx) =>
  c.req.query('key') || /^Bearer (.+)$/.exec(c.req.header('authorization') ?? '')?.[1];

/** Constant-time check of the owner key, from the `key` query param or `Authorization: Bearer`. */
export async function adminOk(c: Ctx): Promise<boolean> {
  const given = givenKey(c);
  const secret = c.env.ADMIN_KEY;
  if (!given || !secret) return false;
  const [a, b] = await Promise.all([digest(given), digest(secret)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

const esc = (v: unknown) =>
  String(v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

const table = (head: string[], rows: unknown[][]) =>
  `<div class="scroll"><table><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${rows
    .map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`)
    .join('')}</table></div>`;

const playersTable = (rows: Record<string, string | number>[], key: string) => {
  const q = `?key=${encodeURIComponent(key)}`;
  const form = (id: unknown, action: string, label: string, extra = '') =>
    `<form method="post" action="/stats/players/${esc(id)}/${action}${esc(q)}"${extra}><button>${label}</button></form>`;
  const confirmDelete = (r: Record<string, string | number>) =>
    ` onsubmit="return confirm('Delete player ${esc(String(r.id))} and all their scores?')"`;
  return `<div class="scroll"><table><tr><th>Name</th><th>ID</th><th>Created</th><th></th></tr>${rows
    .map(
      (r) =>
        `<tr><td>${esc(r.name)}</td><td>${esc(r.id)}</td><td>${esc(String(r.created ?? '').slice(0, 10))}</td><td>${form(r.id, 'rename', 'RENAME')}${form(r.id, 'delete', 'DELETE', confirmDelete(r))}</td></tr>`,
    )
    .join('')}</table></div>`;
};

const noStore = (c: Ctx) => {
  c.header('cache-control', 'no-store');
  c.header('x-robots-tag', 'noindex');
};

const ID = /^[1-9][0-9]{5}$/;
const IDEA_ID = /^[1-9][0-9]{0,9}$/;

/** Shared guard for the moderation POSTs: 401 without the key, 400 on a malformed id, else null. */
async function guard(c: Ctx, id = ID) {
  noStore(c);
  if (!(await adminOk(c))) return c.text('Unauthorized', 401);
  if (!id.test(c.req.param('id')!)) return c.text('Bad id', 400);
  return null;
}

const back = (c: Ctx, hash = '') => c.redirect(`/stats?key=${encodeURIComponent(givenKey(c)!)}${hash}`, 303);

/** IDEAS: set an idea's status and the short answer the players see (form fields `status` and `reply`). */
export async function ideaStatusRoute(c: Ctx) {
  const denied = await guard(c, IDEA_ID);
  if (denied) return denied;
  const form = await c.req.parseBody();
  const status = String(form.status ?? '');
  if (!STATUSES.includes(status as Status)) return c.text('Bad status', 400);
  const reply = ideaText(form.reply, REPLY_MAX);
  // (a closed idea keeps the votes it got, so the list still shows how wanted it was)
  await c.env.DB.prepare('UPDATE ideas SET status = ?1, reply = ?2, updated = ?3 WHERE id = ?4')
    .bind(status, reply, new Date().toISOString(), Number(c.req.param('id')))
    .run();
  return back(c, '#ideas');
}

export async function deleteIdeaRoute(c: Ctx) {
  const denied = await guard(c, IDEA_ID);
  if (denied) return denied;
  await deleteIdea(c.env.DB, Number(c.req.param('id')));
  return back(c, '#ideas');
}

const ideasTable = (rows: Record<string, string | number>[], key: string) => {
  const q = esc(`?key=${encodeURIComponent(key)}`);
  if (!rows.length) return '<p>No ideas yet.</p>';
  return rows
    .map((r) => {
      const opts = STATUSES.map((s) => `<option${s === r.status ? ' selected' : ''}>${s}</option>`).join('');
      return `<div class="idea ${esc(r.status)}"><b>#${esc(r.id)} ${esc(r.title)}</b> <span class="dim">▲${esc(r.votes)} · ${esc(r.name)} (${esc(r.player)}) · ${esc(String(r.created).slice(0, 10))}</span>
${r.body ? `<div>${esc(r.body)}</div>` : ''}
<form method="post" action="/stats/ideas/${esc(r.id)}/status${q}"><select name="status">${opts}</select> <input name="reply" maxlength="${REPLY_MAX}" placeholder="reply (optional)" value="${esc(r.reply)}"> <button>SAVE</button></form>
<form method="post" action="/stats/ideas/${esc(r.id)}/delete${q}" onsubmit="return confirm('Delete idea #${esc(r.id)}?')"><button>DELETE</button></form></div>`;
    })
    .join('');
};

export async function renamePlayerRoute(c: Ctx) {
  const denied = await guard(c);
  if (denied) return denied;
  const id = c.req.param('id')!;
  const name = `P${id}`;
  try {
    await c.env.DB.prepare('UPDATE players SET name = ?1, name_key = ?2 WHERE id = ?3').bind(name, nameKey(name), id).run();
  } catch (e) {
    if (!/UNIQUE constraint failed/i.test(String((e as Error)?.message ?? e))) throw e;
  }
  return back(c);
}

export async function deletePlayerRoute(c: Ctx) {
  const denied = await guard(c);
  if (denied) return denied;
  const id = c.req.param('id')!;
  await deletePlayer(c.env.DB, id);
  return back(c);
}

export async function statsRoute(c: Ctx) {
  if (!(await adminOk(c))) return c.text('Unauthorized', 401);
  const db = c.env.DB;
  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

  const key = givenKey(c) ?? '';
  const [days, uniqDays, pages, countries, recent, ideaRows] = await db.batch<Record<string, string | number>>([
    db.prepare('SELECT day, SUM(views) AS views FROM hits_daily WHERE day >= ? GROUP BY day ORDER BY day DESC').bind(since),
    db.prepare('SELECT day, COUNT(DISTINCT vid) AS uniques FROM hits_uniq WHERE day >= ? GROUP BY day').bind(since),
    db.prepare(
      `SELECT d.page AS page, d.views AS views, COALESCE(u.uniques, 0) AS uniques
       FROM (SELECT page, SUM(views) AS views FROM hits_daily WHERE day >= ?1 GROUP BY page) d
       LEFT JOIN (SELECT page, COUNT(DISTINCT vid) AS uniques FROM hits_uniq WHERE day >= ?1 GROUP BY page) u ON u.page = d.page
       ORDER BY d.views DESC`,
    ).bind(since),
    db
      .prepare('SELECT country, SUM(views) AS views FROM hits_country WHERE day >= ? GROUP BY country ORDER BY views DESC LIMIT 15')
      .bind(since),
    db.prepare('SELECT id, name, created FROM players ORDER BY created DESC, id DESC LIMIT 50'),
    db.prepare(
      `SELECT i.id AS id, i.title AS title, i.body AS body, i.status AS status, i.reply AS reply, i.votes AS votes,
              i.created AS created, i.player AS player, COALESCE(p.name, '?') AS name
       FROM ideas i LEFT JOIN players p ON p.id = i.player
       ORDER BY i.status = 'untriaged' DESC, i.status = 'accepted' DESC, i.votes DESC, i.id DESC LIMIT 200`,
    ),
  ]);

  const uniqByDay = new Map(uniqDays!.results.map((r) => [r.day, r.uniques]));
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Pixel Arcade stats</title>
<style>
body{font:15px/1.4 system-ui,sans-serif;margin:0 auto;padding:16px;max-width:640px;background:#111;color:#eee}
h1{font-size:20px}h2{font-size:16px;margin-top:28px}
.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%}
form{display:inline;margin:0}button{font:inherit;font-size:12px;padding:2px 6px;margin-right:4px;cursor:pointer}
th,td{text-align:left;padding:4px 10px 4px 0;border-bottom:1px solid #333;white-space:nowrap}
.idea{border-left:4px solid #888;padding:6px 10px;margin:8px 0;background:#1a1a1a}.idea form{display:block;margin-top:6px}
.idea input{font:inherit;font-size:12px;width:min(320px,60%)}.idea select{font:inherit;font-size:12px}.dim{color:#999;font-size:13px}
.untriaged{border-color:#1ec8e0}.accepted{border-color:#ffd23f}.rejected{border-color:#ff5a5a}.implemented{border-color:#5ad43f}
</style></head><body>
<h1>PIXEL ARCADE STATS</h1>
<p>Last 30 days, UTC.</p>
<h2>Per day</h2>
${table(['Day', 'Views', 'Unique visitors'], days!.results.map((r) => [r.day, r.views, uniqByDay.get(r.day) ?? 0]))}
<h2>Per page</h2>
${table(['Page', 'Views', 'Uniques'], pages!.results.map((r) => [r.page, r.views, r.uniques]))}
<h2>Top countries</h2>
${table(['Country', 'Views'], countries!.results.map((r) => [r.country, r.views]))}
<h2>Players (newest 50)</h2>
${playersTable(recent!.results, key)}
<h2 id="ideas">Ideas (untriaged first)</h2>
${ideasTable(ideaRows!.results, key)}
</body></html>`;
  return c.html(html, 200, { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
}
