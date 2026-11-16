import { Hono } from 'hono';
import type { AppEnv } from './auth';

// TURN: a relay for the phones' WebRTC links (online games, voice chat, calls from the chat). Two phones often can't
// reach each other directly (mobile data, or a Wi-Fi that keeps its devices apart); then everything goes through a
// TURN server. The arcade asks here for Cloudflare's (Realtime TURN): this endpoint turns the TURN key (two Worker
// secrets: TURN_KEY_ID and TURN_KEY_API_TOKEN, made in the Cloudflare dashboard under Realtime > TURN Server) into
// credentials that last a day. Without the secrets it answers an empty list and the arcade uses its free relays.

const TTL = 86400;          // the credentials last a day
const KEEP = 6 * 3600e3;    // one set is handed out for 6 hours (so every phone gets one with at least 18 hours left)

type Ice = { urls: string | string[]; username?: string; credential?: string };
let kept: { at: number; servers: Ice[] } | null = null;

/** Browsers refuse port 53, so those addresses are left out (Cloudflare's advice). */
export const usable = (servers: Ice[]): Ice[] =>
  servers
    .map((s) => ({ ...s, urls: (Array.isArray(s.urls) ? s.urls : [s.urls]).filter((u) => typeof u === 'string' && !/:53(\?|$)/.test(u)) }))
    .filter((s) => s.urls.length > 0);

export const turn = new Hono<AppEnv>();

turn.get('/v1/turn', async (c) => {
  const id = c.env.TURN_KEY_ID, token = c.env.TURN_KEY_API_TOKEN;
  c.header('Cache-Control', 'no-store');
  if (!id || !token) return c.json({ iceServers: [] });
  if (!kept || Date.now() - kept.at > KEEP) {
    try {
      const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ttl: TTL }),
      });
      if (!res.ok) throw new Error('turn ' + res.status);
      const data = (await res.json()) as { iceServers?: Ice[] | Ice };
      const list = Array.isArray(data.iceServers) ? data.iceServers : data.iceServers ? [data.iceServers] : [];
      kept = { at: Date.now(), servers: usable(list) };
    } catch (e) {
      return c.json({ iceServers: kept ? kept.servers : [] });      // (Cloudflare didn't answer: the last ones, if any)
    }
  }
  return c.json({ iceServers: kept.servers });
});
