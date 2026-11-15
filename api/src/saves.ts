import { Hono } from 'hono';
import { z } from 'zod';
import { requirePlayer } from './auth';
import type { AppEnv } from './auth';

/** The biggest save the server keeps (characters of the packed blob). D1 allows up to 2 MB in a row. */
export const MAX_SAVE = 1_500_000;

// `base` is the rev this phone last saw (0 = it never saw one). A save only goes in on top of that rev: if another
// phone saved in between, the answer is CONFLICT with the rev that is there now, and the phone merges and tries again.
const putBody = z.object({ base: z.number().int().min(0), data: z.string().min(1).max(MAX_SAVE) });

type SaveRow = { rev: number; data: string; updated: string };

export const saves = new Hono<AppEnv>();

saves.get('/v1/save', requirePlayer, async (c) => {
  const row = await c.env.DB.prepare('SELECT rev, data, updated FROM saves WHERE player = ?').bind(c.get('player').id).first<SaveRow>();
  if (!row) return c.json({ error: 'NO_SAVE' }, 404);
  return c.json(row);
});

saves.put('/v1/save', requirePlayer, async (c) => {
  const text = await c.req.text();
  if (text.length > MAX_SAVE + 200) return c.json({ error: 'TOO_BIG' }, 413);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return c.json({ error: 'BAD' }, 400);
  }
  const r = putBody.safeParse(json);
  if (!r.success) {
    const big = typeof (json as { data?: unknown })?.data === 'string' && (json as { data: string }).data.length > MAX_SAVE;
    return c.json({ error: big ? 'TOO_BIG' : 'BAD' }, big ? 413 : 400);
  }
  const { base, data } = r.data;
  const id = c.get('player').id;
  const now = new Date().toISOString();
  const db = c.env.DB;
  // one statement each, so two phones saving at the same moment can't both win
  const res = base === 0
    ? await db.prepare('INSERT INTO saves (player, rev, data, updated) VALUES (?, 1, ?, ?) ON CONFLICT (player) DO NOTHING').bind(id, data, now).run()
    : await db.prepare('UPDATE saves SET rev = rev + 1, data = ?, updated = ? WHERE player = ? AND rev = ?').bind(data, now, id, base).run();
  if (!res.meta.changes) {
    const cur = await db.prepare('SELECT rev FROM saves WHERE player = ?').bind(id).first<number>('rev');
    return c.json({ error: 'CONFLICT', rev: cur ?? 0 }, 409);
  }
  return c.json({ rev: base + 1, updated: now });
});
