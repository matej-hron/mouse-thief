import type { Context } from 'hono';
import type { Env } from './index';

type Ctx = Context<{ Bindings: Env }>;

const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

/** Constant-time check of the owner key, from the `key` query param or `Authorization: Bearer`. */
export async function adminOk(c: Ctx): Promise<boolean> {
  const bearer = /^Bearer (.+)$/.exec(c.req.header('authorization') ?? '')?.[1];
  const given = c.req.query('key') ?? bearer;
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

export async function statsRoute(c: Ctx) {
  if (!(await adminOk(c))) return c.text('Unauthorized', 401);
  const db = c.env.DB;
  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

  const [days, uniqDays, pages, countries] = await db.batch<Record<string, string | number>>([
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
  ]);

  const uniqByDay = new Map(uniqDays!.results.map((r) => [r.day, r.uniques]));
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Pixel Arcade stats</title>
<style>
body{font:15px/1.4 system-ui,sans-serif;margin:0 auto;padding:16px;max-width:640px;background:#111;color:#eee}
h1{font-size:20px}h2{font-size:16px;margin-top:28px}
.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%}
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
</body></html>`;
  return c.html(html, 200, { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
}
