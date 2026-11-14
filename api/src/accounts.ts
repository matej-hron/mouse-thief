import { Hono } from 'hono';
import { z } from 'zod';
import { newSalt, newToken, requirePlayer, safeEqual, sha256hex, storedSecret } from './auth';
import type { AppEnv, Ctx } from './auth';
import { badName, cleanName, nameKey } from './names';

const MAX_FAILS = 10;
const WINDOW_SECONDS = 15 * 60;

const hex = z.string().regex(/^([0-9a-f]{32}|[0-9a-f]{64})$/);
const name = z.string().refine((v) => v.length >= 2 && cleanName(v) === v);
const avatar = z.object({ shape: z.string().regex(/^[a-z]{2,12}$/), color: z.number().int().min(0).max(9) });

const registerBody = z.object({ id: z.string().regex(/^[1-9][0-9]{5}$/), name, avatar, csalt: hex, pw: hex, rsalt: hex, rpw: hex });
const nameBody = z.object({ name: z.string().max(40) });
const loginBody = z.object({ name: z.string().max(40), pw: hex });
const resetBody = z.object({ name: z.string().max(40), rpw: hex, csalt: hex, pw: hex });
const meBody = z.object({ name: name.optional(), avatar: avatar.optional() });
const passwordBody = z.object({ csalt: hex, pw: hex });

type PlayerRow = {
  id: string; name: string; name_key: string; shape: string; color: number;
  csalt: string; ssalt: string; pw: string; rsalt: string; rssalt: string; rpw: string;
};

const bad = (c: Ctx) => c.json({ error: 'BAD' }, 400);

async function parse<T extends z.ZodType>(c: Ctx, schema: T): Promise<z.infer<T> | null> {
  let json: unknown;
  try {
    json = JSON.parse(await c.req.text());
  } catch {
    return null;
  }
  const r = schema.safeParse(json);
  return r.success ? r.data : null;
}

const findByName = (c: Ctx, key: string) =>
  c.env.DB.prepare('SELECT * FROM players WHERE name_key = ?').bind(key).first<PlayerRow>();

const publicPlayer = (p: { id: string; name: string; shape: string; color: number }) => ({
  id: p.id,
  name: p.name,
  avatar: { shape: p.shape, color: p.color },
});

async function startSession(c: Ctx, playerId: string): Promise<string> {
  const token = newToken();
  await c.env.DB.prepare('INSERT INTO sessions (token_hash, player, created) VALUES (?, ?, ?)')
    .bind(await sha256hex(token), playerId, new Date().toISOString())
    .run();
  return token;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

async function isLocked(c: Ctx, key: string): Promise<boolean> {
  const row = await c.env.DB.prepare('SELECT count, since FROM login_fail WHERE name_key = ?')
    .bind(key)
    .first<{ count: number; since: number }>();
  return !!row && row.count >= MAX_FAILS && nowSeconds() - row.since < WINDOW_SECONDS;
}

/** Counts a wrong password or recovery code; the 15 minute window starts at the first failure. */
async function recordFailure(c: Ctx, key: string): Promise<void> {
  const now = nowSeconds();
  await c.env.DB.prepare(
    `INSERT INTO login_fail (name_key, count, since) VALUES (?1, 1, ?2)
     ON CONFLICT (name_key) DO UPDATE SET
       count = CASE WHEN ?2 - since >= ?3 THEN 1 ELSE count + 1 END,
       since = CASE WHEN ?2 - since >= ?3 THEN ?2 ELSE since END`,
  )
    .bind(key, now, WINDOW_SECONDS)
    .run();
}

const clearFailures = (c: Ctx, key: string) => c.env.DB.prepare('DELETE FROM login_fail WHERE name_key = ?').bind(key).run();

const isUnique = (e: unknown) => /UNIQUE constraint failed/i.test(String((e as Error)?.message ?? e));

export const accounts = new Hono<AppEnv>();

accounts.post('/v1/prelogin', async (c) => {
  const b = await parse(c, nameBody);
  if (!b) return bad(c);
  const key = nameKey(cleanName(b.name));
  const p = await findByName(c, key);
  if (!p) return c.json({ error: 'NO_PLAYER' }, 404);
  if (await isLocked(c, key)) return c.json({ error: 'LOCKED' }, 429);
  return c.json({ csalt: p.csalt, rsalt: p.rsalt });
});

accounts.post('/v1/register', async (c) => {
  const b = await parse(c, registerBody);
  if (!b) return bad(c);
  if (badName(b.name)) return c.json({ error: 'NAME_BAD' }, 422);
  const key = nameKey(b.name);
  const db = c.env.DB;
  if (await db.prepare('SELECT 1 FROM players WHERE id = ?').bind(b.id).first()) return c.json({ error: 'ID_TAKEN' }, 409);
  if (await findByName(c, key)) return c.json({ error: 'NAME_TAKEN' }, 409);

  const ssalt = newSalt();
  const rssalt = newSalt();
  const now = new Date().toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO players (id, name, name_key, shape, color, csalt, ssalt, pw, rsalt, rssalt, rpw, created, seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(b.id, b.name, key, b.avatar.shape, b.avatar.color, b.csalt, ssalt, await storedSecret(ssalt, b.pw), b.rsalt, rssalt, await storedSecret(rssalt, b.rpw), now, now)
      .run();
  } catch (e) {
    if (!isUnique(e)) throw e;
    const idTaken = String((e as Error).message).includes('players.id');
    return c.json({ error: idTaken ? 'ID_TAKEN' : 'NAME_TAKEN' }, 409);
  }
  return c.json({ token: await startSession(c, b.id) }, 201);
});

accounts.post('/v1/login', async (c) => {
  const b = await parse(c, loginBody);
  if (!b) return bad(c);
  const key = nameKey(cleanName(b.name));
  const p = await findByName(c, key);
  if (!p) return c.json({ error: 'NO_PLAYER' }, 404);
  if (await isLocked(c, key)) return c.json({ error: 'LOCKED' }, 429);
  if (!safeEqual(await storedSecret(p.ssalt, b.pw), p.pw)) {
    await recordFailure(c, key);
    return c.json({ error: 'WRONG' }, 401);
  }
  await clearFailures(c, key);
  return c.json({ token: await startSession(c, p.id), ...publicPlayer(p) });
});

accounts.post('/v1/reset', async (c) => {
  const b = await parse(c, resetBody);
  if (!b) return bad(c);
  const key = nameKey(cleanName(b.name));
  const p = await findByName(c, key);
  if (!p) return c.json({ error: 'NO_PLAYER' }, 404);
  if (await isLocked(c, key)) return c.json({ error: 'LOCKED' }, 429);
  if (!safeEqual(await storedSecret(p.rssalt, b.rpw), p.rpw)) {
    await recordFailure(c, key);
    return c.json({ error: 'WRONG' }, 401);
  }
  const ssalt = newSalt();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE players SET csalt = ?, ssalt = ?, pw = ? WHERE id = ?').bind(b.csalt, ssalt, await storedSecret(ssalt, b.pw), p.id),
    c.env.DB.prepare('DELETE FROM sessions WHERE player = ?').bind(p.id),
    c.env.DB.prepare('DELETE FROM login_fail WHERE name_key = ?').bind(key),
  ]);
  return c.json({ token: await startSession(c, p.id) });
});

accounts.get('/v1/me', requirePlayer, async (c) => {
  const p = await c.env.DB.prepare('SELECT id, name, shape, color FROM players WHERE id = ?')
    .bind(c.get('player').id)
    .first<PlayerRow>();
  return c.json(publicPlayer(p!));
});

accounts.put('/v1/me', requirePlayer, async (c) => {
  const b = await parse(c, meBody);
  if (!b) return bad(c);
  const id = c.get('player').id;
  if (b.name !== undefined) {
    if (badName(b.name)) return c.json({ error: 'NAME_BAD' }, 422);
    const other = await findByName(c, nameKey(b.name));
    if (other && other.id !== id) return c.json({ error: 'NAME_TAKEN' }, 409);
  }
  try {
    await c.env.DB.prepare(
      'UPDATE players SET name = COALESCE(?1, name), name_key = COALESCE(?2, name_key), shape = COALESCE(?3, shape), color = COALESCE(?4, color) WHERE id = ?5',
    )
      .bind(b.name ?? null, b.name ? nameKey(b.name) : null, b.avatar?.shape ?? null, b.avatar?.color ?? null, id)
      .run();
  } catch (e) {
    if (isUnique(e)) return c.json({ error: 'NAME_TAKEN' }, 409);
    throw e;
  }
  const p = await c.env.DB.prepare('SELECT id, name, shape, color FROM players WHERE id = ?').bind(id).first<PlayerRow>();
  return c.json(publicPlayer(p!));
});

accounts.post('/v1/password', requirePlayer, async (c) => {
  const b = await parse(c, passwordBody);
  if (!b) return bad(c);
  const id = c.get('player').id;
  const ssalt = newSalt();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE players SET csalt = ?, ssalt = ?, pw = ? WHERE id = ?').bind(b.csalt, ssalt, await storedSecret(ssalt, b.pw), id),
    c.env.DB.prepare('DELETE FROM sessions WHERE player = ? AND token_hash != ?').bind(id, c.get('tokenHash')),
  ]);
  return c.body(null, 204);
});

accounts.delete('/v1/me', requirePlayer, async (c) => {
  const id = c.get('player').id;
  const db = c.env.DB;
  await db.batch([
    db.prepare('DELETE FROM scores WHERE player = ?').bind(id),
    db.prepare('DELETE FROM sessions WHERE player = ?').bind(id),
    db.prepare('DELETE FROM players WHERE id = ?').bind(id),
  ]);
  return c.body(null, 204);
});

accounts.delete('/v1/session', requirePlayer, async (c) => {
  await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(c.get('tokenHash')).run();
  return c.body(null, 204);
});
