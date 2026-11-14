import type { Context } from 'hono';
import type { Env } from './index';
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

const ID = /^[1-9][0-9]{5}$/;

/** Shared guard for the moderation POSTs: 401 without the key, 400 on a malformed id, else null. */
async function guard(c: Ctx) {
  if (!(await adminOk(c))) return c.text('Unauthorized', 401);
  if (!ID.test(c.req.param('id')!)) return c.text('Bad id', 400);
  return null;
}

const back = (c: Ctx) => c.redirect(`/stats?key=${encodeURIComponent(givenKey(c)!)}`, 303);

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
  const db = c.env.DB;
  await db.batch([
    db.prepare('DELETE FROM login_fail WHERE name_key = (SELECT name_key FROM players WHERE id = ?)').bind(id),
    db.prepare('DELETE FROM scores WHERE player = ?').bind(id),
    db.prepare('DELETE FROM sessions WHERE player = ?').bind(id),
    db.prepare('DELETE FROM players WHERE id = ?').bind(id),
  ]);
  return back(c);
}

export async function statsRoute(c: Ctx) {
  if (!(await adminOk(c))) return c.text('Unauthorized', 401);
  const db = c.env.DB;
  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

  const key = givenKey(c) ?? '';
  const [days, uniqDays, pages, countries, recent] = await db.batch<Record<string, string | number>>([
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
</body></html>`;
  return c.html(html, 200, { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
}
