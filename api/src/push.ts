import { Hono } from 'hono';
import { z } from 'zod';
import { playerFromRequest, requirePlayer } from './auth';
import type { AppEnv, Ctx } from './auth';
import { badName, cleanName } from './names';
import { adminOk } from './stats';
import { sendPush } from './webpush';
import type { Subscription, Vapid } from './webpush';

// --- NOTIFICATIONS: the phone gets a notification for a gift, a friend request, an invite, a chat message or a call -
// A player with an account turns them on in SETTINGS: the browser makes a push subscription and the phone sends it
// here (POST /v1/push/sub), kept with the player's ID. When the arcade sends a friend something through ntfy.sh (a
// gift, a request, an invite, a chat message), it also asks this server to notify them (POST /v1/push/send). The
// server writes the words itself from the kind of message, so nobody can push their own text to a phone, and it never
// sends what a chat message says, only who wrote.

const MAX_SUBS = 5; // phones (browsers) per player; the oldest goes when a sixth is added

// Only the browsers' own push services: the server never posts anywhere else.
const PUSH_HOSTS = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.apple\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)$/;
const endpoint = z.string().max(1000).refine((v) => {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && PUSH_HOSTS.test(u.hostname);
  } catch {
    return false;
  }
});
const key = (min: number, max: number) => z.string().regex(/^[A-Za-z0-9_-]+$/).min(min).max(max);
const subBody = z.object({ endpoint, keys: z.object({ p256dh: key(80, 100), auth: key(16, 32) }) });
const unsubBody = z.object({ endpoint: z.string().max(1000) });
const playerId = z.string().regex(/^[1-9][0-9]{5}$/);
const sendBody = z.object({
  to: z.union([playerId, z.array(playerId).min(1).max(8)]),   // several players at once: the members of a group chat
  t: z.enum(['gift', 'back', 'freq', 'fyes', 'inv', 'chat', 'call', 'gchat', 'gadd']),
  from: z.string().max(40).optional(),
  fid: playerId.optional(),
  n: z.number().int().min(1).max(1000).optional(),
  g: z.string().regex(/^[a-z]{2,12}$/).optional(),
  code: z.string().regex(/^[A-Z0-9]{4}$/).optional(),
  gn: z.string().max(40).optional(),                          // a group chat's name (checked like a player's name)
  gid: z.string().regex(/^[a-z0-9]{12}$/).optional(),         // and its ID (for the notification's tag)
});
export type PushKind = z.infer<typeof sendBody>['t'] | 'test';

const GAME_NAMES: Record<string, string> = {
  thief: 'MOUSE THIEF', racer: 'PIXEL GP', pong: 'PIXEL PONG', football: 'PIXEL FOOTBALL', wings: 'PIXEL WINGS',
  skate: 'PIXEL SKATE', ski: 'PIXEL SKI', boxfight: 'PIXEL BOX FIGHT', bike: 'PIXEL BIKE RUN', skygp: 'PIXEL SKY GP',
  moto: 'PIXEL MOTO', snake: 'PIXEL SNAKE', hook: 'PIXEL HOOK', party: 'PIXEL PARTY',
};

export type Note = { title: string; body: string; url: string; tag: string; call?: true };   // call: the phone rings (vibrates long, stays on)

/** The words of a notification: written here, from the kind and a few checked values, never taken from the sender. */
export function noteFor(b: { t: PushKind; name: string; fid?: string; n?: number; g?: string; code?: string; gn?: string; gid?: string }): Note | null {
  const who = b.name;
  switch (b.t) {
    case 'gift':
      return b.n ? { title: `★${b.n} FROM ${who}!`, body: 'OPEN THE ARCADE TO TAKE YOUR STARS.', url: 'index.html', tag: 'gift' } : null;
    case 'back':
      return b.n ? { title: `${who} SAID NO THANKS`, body: `YOUR ★${b.n} ARE BACK: OPEN THE ARCADE TO TAKE THEM.`, url: 'index.html', tag: 'gift' } : null;
    case 'freq':
      return { title: `${who} WANTS TO BE YOUR FRIEND`, body: 'OPEN FRIENDS IN THE ARCADE TO SAY YES OR NO.', url: 'index.html', tag: `friend-${b.fid ?? who}` };
    case 'fyes':
      return { title: `${who} IS YOUR FRIEND NOW!`, body: 'SAY HI IN THE CHAT, OR INVITE THEM TO A GAME.', url: 'index.html', tag: `friend-${b.fid ?? who}` };
    case 'inv': {
      const game = b.g && GAME_NAMES[b.g];
      if (!game || !b.code) return null;
      return { title: `${who} INVITES YOU TO PLAY`, body: `${game} - TAP TO JOIN (CODE ${b.code})`, url: `${b.g}.html?join=${b.code}`, tag: 'invite' };
    }
    case 'chat':
      return { title: `NEW MESSAGE FROM ${who}`, body: 'TAP TO READ IT IN THE ARCADE.', url: 'index.html', tag: `chat-${b.fid ?? who}` };
    case 'gchat':                                                 // a message in a group chat (FRIENDS → GROUPS)
      return b.gn && b.gid ? { title: `NEW MESSAGE IN ${b.gn}`, body: `FROM ${who}. TAP TO READ IT IN THE ARCADE.`, url: 'index.html', tag: `gchat-${b.gid}` } : null;
    case 'gadd':                                                  // a friend put you in a group chat
      return b.gn && b.gid ? { title: `${who} ADDED YOU TO ${b.gn}`, body: 'A GROUP CHAT: OPEN FRIENDS, THEN GROUPS, AND SAY HI.', url: 'index.html', tag: `gchat-${b.gid}` } : null;
    case 'call':                                                  // CALL in the arcade's chat, while your arcade isn't open
      return { title: `${who} IS CALLING YOU!`, body: 'OPEN THE ARCADE TO ANSWER.', url: 'index.html', tag: `call-${b.fid ?? who}`, call: true };
    case 'test':
      return { title: 'PIXEL GAMES', body: 'NOTIFICATIONS WORK! YOU WILL HEAR FROM YOUR FRIENDS HERE.', url: 'index.html', tag: 'test' };
  }
}

const vapidOf = (c: Ctx): Vapid | null =>
  c.env.VAPID_PUBLIC_KEY && c.env.VAPID_PRIVATE_KEY
    ? { publicKey: c.env.VAPID_PUBLIC_KEY, privateKey: c.env.VAPID_PRIVATE_KEY, subject: 'https://matej-hron.github.io/mouse-thief/' }
    : null;

/** Sends a note to every phone of a player; forgets the subscriptions the push service says are gone. The statuses. */
export async function notifyPlayer(db: D1Database, vapid: Vapid, player: string, note: Note): Promise<number[]> {
  const { results } = await db
    .prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE player = ?')
    .bind(player)
    .all<Subscription>();
  const statuses = await Promise.all(results.map((s) => sendPush(s, note, vapid)));
  const gone = results.filter((_, i) => statuses[i] === 404 || statuses[i] === 410);
  if (gone.length) await db.batch(gone.map((s) => db.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(s.endpoint)));
  return statuses;
}

async function parse<T extends z.ZodType>(c: Ctx, schema: T): Promise<z.infer<T> | null> {
  try {
    const r = schema.safeParse(JSON.parse(await c.req.text()));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

const bad = (c: Ctx) => c.json({ error: 'BAD' }, 400);
const off = (c: Ctx) => c.json({ error: 'NO_PUSH' }, 503);

export const push = new Hono<AppEnv>();

/** The arcade's public VAPID key: the browser needs it to make a subscription. */
push.get('/v1/push/key', (c) => (c.env.VAPID_PUBLIC_KEY ? c.json({ key: c.env.VAPID_PUBLIC_KEY }) : off(c)));

/** Keep this phone's subscription for the logged-in player (also moves it from another account on the same phone). */
push.post('/v1/push/sub', requirePlayer, async (c) => {
  const b = await parse(c, subBody);
  if (!b) return bad(c);
  const me = c.get('player').id;
  const db = c.env.DB;
  await db.batch([
    db
      .prepare(
        'INSERT INTO push_subs (endpoint, player, p256dh, auth, created) VALUES (?, ?, ?, ?, ?) ' +
          'ON CONFLICT (endpoint) DO UPDATE SET player = excluded.player, p256dh = excluded.p256dh, auth = excluded.auth, created = excluded.created',
      )
      .bind(b.endpoint, me, b.keys.p256dh, b.keys.auth, new Date().toISOString()),
    db
      .prepare(
        'DELETE FROM push_subs WHERE player = ? AND endpoint NOT IN (SELECT endpoint FROM push_subs WHERE player = ? ORDER BY created DESC, endpoint LIMIT ?)',
      )
      .bind(me, me, MAX_SUBS),
  ]);
  return c.body(null, 204);
});

/** Forget a subscription (notifications turned off, or logged out). Knowing the endpoint is enough: it is a secret. */
push.delete('/v1/push/sub', async (c) => {
  const b = await parse(c, unsubBody);
  if (!b) return bad(c);
  await c.env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(b.endpoint).run();
  return c.body(null, 204);
});

/**
 * Tell a player's phones about something the arcade just sent them through ntfy.sh. Anyone may call it (like
 * ntfy.sh), at most 30 times a minute from one address. With a session the sender's name and ID are the account's.
 * Always 204: it doesn't tell whether that player has notifications on.
 */
push.post('/v1/push/send', async (c) => {
  const vapid = vapidOf(c);
  if (!vapid) return off(c);
  const { success } = await c.env.PUSH_LIMIT.limit({ key: c.req.header('cf-connecting-ip') ?? 'unknown' });
  if (!success) return c.json({ error: 'SLOW_DOWN' }, 429);
  const b = await parse(c, sendBody);
  if (!b) return bad(c);
  const sender = await playerFromRequest(c);
  const fid = sender ? sender.player.id : b.fid;
  let name = sender ? sender.player.name : cleanName(b.from ?? '');
  if (!name || badName(name)) name = 'A FRIEND';
  let gn: string | undefined;
  if (b.gn !== undefined) {
    gn = cleanName(b.gn);
    if (!gn || badName(gn)) gn = 'A GROUP';
  }
  const note = noteFor({ ...b, name, fid, gn });
  if (!note) return bad(c);
  const to = [...new Set(Array.isArray(b.to) ? b.to : [b.to])].filter((id) => id !== fid);
  if (to.length > 1 && b.t !== 'gchat' && b.t !== 'gadd') return bad(c);   // (only a group's notes go to several players)
  if (to.length) c.executionCtx.waitUntil(Promise.all(to.map((id) => notifyPlayer(c.env.DB, vapid, id, note))));
  return c.body(null, 204);
});

/** A test notification to your own phones (SEND A TEST in SETTINGS). How many phones it went to. */
push.post('/v1/push/test', requirePlayer, async (c) => {
  const vapid = vapidOf(c);
  if (!vapid) return off(c);
  const statuses = await notifyPlayer(c.env.DB, vapid, c.get('player').id, noteFor({ t: 'test', name: '' })!);
  return c.json({ phones: statuses.length, sent: statuses.filter((s) => s >= 200 && s < 300).length });
});

/** The owner sends a test notification to a player (admin key). The push services' answers. */
push.post('/v1/admin/push/:id', async (c) => {
  if (!(await adminOk(c as unknown as Parameters<typeof adminOk>[0]))) return c.json({ error: 'AUTH' }, 401);
  const vapid = vapidOf(c);
  if (!vapid) return off(c);
  const id = c.req.param('id');
  if (!playerId.safeParse(id).success) return bad(c);
  const statuses = await notifyPlayer(c.env.DB, vapid, id, noteFor({ t: 'test', name: '' })!);
  return c.json({ phones: statuses.length, statuses });
});
