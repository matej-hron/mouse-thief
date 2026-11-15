import { Hono } from 'hono';
import { z } from 'zod';
import { playerFromRequest, requirePlayer } from './auth';
import type { AppEnv, Ctx } from './auth';
import { censor } from './censor';

// IDEAS: feature requests. Anyone can read them; a player with an account can write one (a few a day), take back
// their own while nobody has looked at it yet, and upvote other players' ideas. The owner sets the status on the stats page.

export const STATUSES = ['untriaged', 'accepted', 'rejected', 'implemented'] as const;
export type Status = (typeof STATUSES)[number];
const OPEN: Status[] = ['untriaged', 'accepted']; // (votes count only while the idea is still open)

export const TITLE_MIN = 4;
export const TITLE_MAX = 40;
export const BODY_MAX = 200;
export const REPLY_MAX = 120;
export const PER_DAY = 3;
const PAGE_SIZE = 6;
const MAX_PAGE = 49;

/** What the arcade's pixel font can draw: capitals without accents, digits, a few signs; single spaces, trimmed. */
export const ideaText = (v: unknown, max: number): string =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .,!?:\-+/'%()<>=*#"_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();

/** The same idea twice: letters and digits only. */
export const titleKey = (title: string) => title.replace(/[^A-Z0-9]/g, '');

const newIdea = z.object({ title: z.string().max(400), body: z.string().max(2000).optional() });

type Row = {
  id: number; title: string; body: string; status: Status; reply: string; votes: number; created: string;
  player: string; name: string; shape: string; color: number; voted: number;
};

// the first ? is the viewer's player id ('' without a token), for `voted`
const SELECT = `SELECT i.id AS id, i.title AS title, i.body AS body, i.status AS status, i.reply AS reply, i.votes AS votes,
              i.created AS created, i.player AS player, p.name AS name, p.shape AS shape, p.color AS color,
              EXISTS (SELECT 1 FROM idea_votes v WHERE v.idea = i.id AND v.player = ?) AS voted
       FROM ideas i JOIN players p ON p.id = i.player`;

const out = (r: Row, viewer: string | undefined) => ({
  id: r.id, title: r.title, body: r.body, status: r.status, reply: r.reply, votes: r.votes, created: r.created.slice(0, 10),
  name: r.name, shape: r.shape, color: r.color,
  ...(viewer && r.player === viewer ? { mine: true as const } : {}),
  ...(r.voted ? { voted: true as const } : {}),
});

export const ideas = new Hono<AppEnv>();

const ideaId = (c: Ctx) => {
  const id = c.req.param('id') ?? '';
  return /^[1-9][0-9]{0,9}$/.test(id) ? Number(id) : null;
};

ideas.get('/v1/ideas', async (c) => {
  const status = c.req.query('status') ?? 'all';
  const sort = c.req.query('sort') ?? 'top';
  const pageParam = c.req.query('page') ?? '0';
  const page = /^\d{1,2}$/.test(pageParam) ? Number(pageParam) : -1;
  if ((status !== 'all' && !STATUSES.includes(status as Status)) || (sort !== 'top' && sort !== 'new') || page < 0 || page > MAX_PAGE)
    return c.json({ error: 'BAD' }, 400);
  const viewer = await playerFromRequest(c);
  const mine = c.req.query('mine') === '1';
  if (mine && !viewer) return c.json({ error: 'AUTH' }, 401);

  const where: string[] = [];
  const binds: unknown[] = [viewer?.player.id ?? ''];
  if (status !== 'all') { where.push('i.status = ?'); binds.push(status); }
  if (mine) { where.push('i.player = ?'); binds.push(viewer!.player.id); }
  binds.push(PAGE_SIZE + 1, page * PAGE_SIZE);
  const db = c.env.DB;
  const [list, counts] = await db.batch<Record<string, unknown>>([
    db.prepare(
      `${SELECT}
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY ${sort === 'top' ? 'i.votes DESC, ' : ''}i.id DESC
       LIMIT ? OFFSET ?`,
    ).bind(...binds),
    db.prepare('SELECT status, COUNT(*) AS n FROM ideas GROUP BY status'),
  ]);
  const rows = list!.results as Row[];
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const r of counts!.results as { status: Status; n: number }[]) if (r.status in byStatus) byStatus[r.status] = r.n;

  // the answer depends on the token (mine, voted): a browser must not reuse an anonymous cached one with a token
  c.header('vary', 'Authorization', { append: true });
  if (!c.req.header('authorization')) c.header('cache-control', 'public, max-age=30');
  return c.json({
    rows: rows.slice(0, PAGE_SIZE).map((r) => out(r, viewer?.player.id)),
    more: rows.length > PAGE_SIZE,
    counts: byStatus,
  });
});

ideas.get('/v1/ideas/:id', async (c) => {
  const id = ideaId(c);
  const viewer = await playerFromRequest(c);
  const row = id === null ? null : await c.env.DB.prepare(`${SELECT} WHERE i.id = ?`).bind(viewer?.player.id ?? '', id).first<Row>();
  if (!row) return c.json({ error: 'NOT_FOUND' }, 404);
  c.header('vary', 'Authorization', { append: true });
  c.header('cache-control', 'no-store');
  return c.json(out(row, viewer?.player.id));
});

ideas.post('/v1/ideas', requirePlayer, async (c) => {
  let json: unknown;
  try {
    json = JSON.parse(await c.req.text());
  } catch {
    return c.json({ error: 'BAD' }, 400);
  }
  const parsed = newIdea.safeParse(json);
  if (!parsed.success) return c.json({ error: 'BAD' }, 400);
  const title = censor(ideaText(parsed.data.title, TITLE_MAX));
  const body = censor(ideaText(parsed.data.body, BODY_MAX));
  const key = titleKey(title);
  if (key.length < TITLE_MIN) return c.json({ error: 'TOO_SHORT' }, 400);

  const db = c.env.DB, me = c.get('player').id, now = new Date().toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const [recent, same] = await db.batch<Record<string, number>>([
    db.prepare('SELECT COUNT(*) AS n FROM ideas WHERE player = ? AND created > ?').bind(me, dayAgo),
    db.prepare('SELECT id FROM ideas WHERE title_key = ? LIMIT 1').bind(key),
  ]);
  if ((recent!.results[0]?.n ?? 0) >= PER_DAY) return c.json({ error: 'TOO_MANY' }, 429);
  const dup = same!.results[0];
  if (dup) return c.json({ error: 'DUPLICATE', id: dup.id }, 409);

  const id = await db
    .prepare('INSERT INTO ideas (player, title, title_key, body, created, updated) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(me, title, key, body, now, now)
    .first<number>('id');
  return c.json({ id, title, body }, 201);
});

// Take back your own idea, while it is still waiting for an answer.
ideas.delete('/v1/ideas/:id', requirePlayer, async (c) => {
  const id = ideaId(c);
  if (id === null) return c.json({ error: 'NOT_FOUND' }, 404);
  const db = c.env.DB;
  const idea = await db.prepare('SELECT player, status FROM ideas WHERE id = ?').bind(id).first<{ player: string; status: Status }>();
  if (!idea) return c.json({ error: 'NOT_FOUND' }, 404);
  if (idea.player !== c.get('player').id) return c.json({ error: 'NOT_YOURS' }, 403);
  if (idea.status !== 'untriaged') return c.json({ error: 'CLOSED' }, 409);
  await deleteIdea(db, id);
  return c.json({ deleted: true });
});

export const deleteIdea = (db: D1Database, id: number) =>
  db.batch([db.prepare('DELETE FROM idea_votes WHERE idea = ?').bind(id), db.prepare('DELETE FROM ideas WHERE id = ?').bind(id)]);

// Upvote (PUT) or take the upvote back (DELETE). Votes are recounted from idea_votes, so a repeat changes nothing.
async function vote(c: Ctx, on: boolean) {
  const id = ideaId(c);
  if (id === null) return c.json({ error: 'NOT_FOUND' }, 404);
  const db = c.env.DB, me = c.get('player').id;
  const idea = await db.prepare('SELECT player, status FROM ideas WHERE id = ?').bind(id).first<{ player: string; status: Status }>();
  if (!idea) return c.json({ error: 'NOT_FOUND' }, 404);
  if (idea.player === me) return c.json({ error: 'OWN' }, 403);
  if (!OPEN.includes(idea.status)) return c.json({ error: 'CLOSED' }, 409);
  const [, , after] = await db.batch<{ votes: number }>([
    on
      ? db.prepare('INSERT OR IGNORE INTO idea_votes (idea, player) VALUES (?, ?)').bind(id, me)
      : db.prepare('DELETE FROM idea_votes WHERE idea = ? AND player = ?').bind(id, me),
    db.prepare('UPDATE ideas SET votes = (SELECT COUNT(*) FROM idea_votes WHERE idea = ?1) WHERE id = ?1').bind(id),
    db.prepare('SELECT votes FROM ideas WHERE id = ?').bind(id),
  ]);
  return c.json({ votes: after!.results[0]?.votes ?? 0, voted: on });
}
ideas.put('/v1/ideas/:id/vote', requirePlayer, (c) => vote(c, true));
ideas.delete('/v1/ideas/:id/vote', requirePlayer, (c) => vote(c, false));

/** Statements that remove a player's ideas and votes (part of deleting the player). */
export const deletePlayerIdeas = (db: D1Database, player: string) => [
  db.prepare('DELETE FROM idea_votes WHERE idea IN (SELECT id FROM ideas WHERE player = ?)').bind(player),
  db.prepare('DELETE FROM ideas WHERE player = ?').bind(player),
  db.prepare('UPDATE ideas SET votes = votes - 1 WHERE id IN (SELECT idea FROM idea_votes WHERE player = ?)').bind(player),
  db.prepare('DELETE FROM idea_votes WHERE player = ?').bind(player),
];
