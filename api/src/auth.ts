import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from './index';

export type Player = { id: string; name: string };
export type AppEnv = { Bindings: Env; Variables: { player: Player; tokenHash: string } };
export type Ctx = Context<AppEnv>;

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export const sha256hex = async (s: string): Promise<string> =>
  toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

export const newToken = (): string => toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);

export const newSalt = (): string => toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);

/** Constant-time equality of two hex digests (equal length by construction). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** What is stored for a secret the phone sent: sha256(server salt + sent value). The sent value itself is never kept. */
export const storedSecret = (salt: string, sent: string) => sha256hex(salt + sent);

/** Looks up the player behind the request's Bearer token. Null when there is no valid token. */
export async function playerFromRequest(
  c: Ctx,
): Promise<{ player: Player; tokenHash: string; seen: string | null } | null> {
  const token = /^Bearer ([0-9a-f]{64})$/.exec(c.req.header('authorization') ?? '')?.[1];
  if (!token) return null;
  const tokenHash = await sha256hex(token);
  const row = await c.env.DB.prepare(
    'SELECT p.id AS id, p.name AS name, p.seen AS seen FROM sessions s JOIN players p ON p.id = s.player WHERE s.token_hash = ?',
  )
    .bind(tokenHash)
    .first<{ id: string; name: string; seen: string | null }>();
  return row ? { player: { id: row.id, name: row.name }, tokenHash, seen: row.seen } : null;
}

export const requirePlayer: MiddlewareHandler<AppEnv> = async (c, next) => {
  const found = await playerFromRequest(c);
  if (!found) return c.json({ error: 'AUTH' }, 401);
  const now = new Date().toISOString();
  if (!found.seen || found.seen.slice(0, 10) < now.slice(0, 10)) {
    await c.env.DB.prepare('UPDATE players SET seen = ? WHERE id = ?').bind(now, found.player.id).run();
  }
  c.set('player', found.player);
  c.set('tokenHash', found.tokenHash);
  await next();
};
