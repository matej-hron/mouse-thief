import type { Context } from 'hono';
import { z } from 'zod';
import type { Env } from './index';

const hitBody = z.object({
  p: z.string().regex(/^([a-z0-9_-]{1,24}\.html)?$/).transform((p) => p || 'index.html'),
  d: z.string().regex(/^[a-z0-9]{8,32}$/),
});

export async function hitRoute(c: Context<{ Bindings: Env }>) {
  let json: unknown;
  try {
    json = JSON.parse(await c.req.text());
  } catch {
    return c.body(null, 400);
  }
  const parsed = hitBody.safeParse(json);
  if (!parsed.success) return c.body(null, 400);
  const { p: page, d: vid } = parsed.data;

  const day = new Date().toISOString().slice(0, 10);
  const country = (c.req.raw.cf?.country as string | undefined) ?? 'XX';
  const db = c.env.DB;
  await db.batch([
    db
      .prepare(
        'INSERT INTO hits_daily (day, page, views) VALUES (?, ?, 1) ON CONFLICT (day, page) DO UPDATE SET views = views + 1',
      )
      .bind(day, page),
    db.prepare('INSERT OR IGNORE INTO hits_uniq (day, page, vid) VALUES (?, ?, ?)').bind(day, page, vid),
    db
      .prepare(
        'INSERT INTO hits_country (day, country, views) VALUES (?, ?, 1) ON CONFLICT (day, country) DO UPDATE SET views = views + 1',
      )
      .bind(day, country),
  ]);
  return c.body(null, 204);
}

/** Unique-visitor rows are only needed for recent stats; daily and country totals are kept forever. */
export async function cleanupHits(db: D1Database, today: string): Promise<void> {
  await db.prepare("DELETE FROM hits_uniq WHERE day < date(?, '-40 days')").bind(today).run();
}
