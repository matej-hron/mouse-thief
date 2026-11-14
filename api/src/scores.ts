import { Hono } from 'hono';
import { z } from 'zod';
import { playerFromRequest, requirePlayer } from './auth';
import type { AppEnv } from './auth';
import { boardRule, inBounds } from './boards';

const PAGE_SIZE = 10;
const MAX_PAGE = 4;
const MAX_ITEMS = 60;

const body = z.object({ scores: z.array(z.object({ b: z.string(), v: z.unknown() })).max(MAX_ITEMS) });

export const scores = new Hono<AppEnv>();

scores.post('/v1/scores', requirePlayer, async (c) => {
  let json: unknown;
  try {
    json = JSON.parse(await c.req.text());
  } catch {
    return c.json({ error: 'BAD' }, 400);
  }
  const parsed = body.safeParse(json);
  if (!parsed.success) return c.json({ error: 'BAD' }, 400);

  const id = c.get('player').id;
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [];
  for (const { b, v } of parsed.data.scores) {
    const rule = boardRule(b);
    if (!rule || !inBounds(rule, v)) continue;
    const better = rule.better === 'higher' ? '>' : '<';
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO scores (player, board, value, updated) VALUES (?, ?, ?, ?)
         ON CONFLICT (player, board) DO UPDATE SET value = excluded.value, updated = excluded.updated
         WHERE excluded.value ${better} scores.value`,
      ).bind(id, b, v, now),
    );
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  return c.json({ saved: stmts.length });
});

scores.get('/v1/boards/:board', async (c) => {
  const board = c.req.param('board');
  const rule = boardRule(board);
  if (!rule) return c.json({ error: 'NOT_FOUND' }, 404);
  const pageParam = c.req.query('page') ?? '0';
  const page = /^\d$/.test(pageParam) ? Number(pageParam) : -1;
  if (page < 0 || page > MAX_PAGE) return c.json({ error: 'BAD' }, 400);

  const db = c.env.DB;
  const dir = rule.better === 'higher' ? 'DESC' : 'ASC';
  const rows = await db
    .prepare(
      `SELECT s.player AS player, p.name AS name, p.shape AS shape, p.color AS color, s.value AS value
       FROM scores s JOIN players p ON p.id = s.player
       WHERE s.board = ?
       ORDER BY s.value ${dir}, s.updated ASC, s.player ASC
       LIMIT ? OFFSET ?`,
    )
    .bind(board, PAGE_SIZE, page * PAGE_SIZE)
    .all<{ player: string; name: string; shape: string; color: number; value: number }>();

  const viewer = await playerFromRequest(c);
  let me: { rank: number; value: number } | null = null;
  if (viewer) {
    const mine = await db
      .prepare('SELECT value, updated FROM scores WHERE player = ? AND board = ?')
      .bind(viewer.player.id, board)
      .first<{ value: number; updated: string }>();
    if (mine) {
      const cmp = rule.better === 'higher' ? '>' : '<';
      const ahead = await db
        .prepare(
          `SELECT COUNT(*) AS n FROM scores WHERE board = ?1 AND (value ${cmp} ?2
             OR (value = ?2 AND (updated < ?3 OR (updated = ?3 AND player < ?4))))`,
        )
        .bind(board, mine.value, mine.updated, viewer.player.id)
        .first<number>('n');
      me = { rank: (ahead ?? 0) + 1, value: mine.value };
    }
  }

  if (!c.req.header('authorization')) c.header('cache-control', 'public, max-age=30');
  return c.json({
    board,
    rows: rows.results.map((r, i) => ({
      rank: page * PAGE_SIZE + i + 1,
      name: r.name,
      shape: r.shape,
      color: r.color,
      value: r.value,
      ...(viewer && r.player === viewer.player.id ? { me: true as const } : {}),
    })),
    me,
  });
});
