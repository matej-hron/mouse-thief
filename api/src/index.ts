import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { accounts } from './accounts';
import { cleanupHits, hitRoute } from './hits';
import { push } from './push';
import { ideas } from './ideas';
import { scores } from './scores';
import { turn } from './turn';
import { deleteIdeaRoute, deletePlayerRoute, ideaStatusRoute, renamePlayerRoute, statsRoute } from './stats';

export type Env = {
  DB: D1Database;
  ADMIN_KEY: string;
  REGISTER_LIMIT: RateLimit;
  PUSH_LIMIT: RateLimit;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  TURN_KEY_ID?: string;          // Cloudflare Realtime TURN (secrets; see turn.ts)
  TURN_KEY_API_TOKEN?: string;
};

const ALLOWED_ORIGIN = /^(https:\/\/matej-hron\.github\.io|https:\/\/(www\.)?pixelgames\.online|http:\/\/(localhost|127\.0\.0\.1):\d+)$/;

/** Returns the origin when it may call the API, otherwise '' (no CORS header). Shared by all routes. */
export const checkOrigin = (origin: string): string => (ALLOWED_ORIGIN.test(origin) ? origin : '');

export const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: checkOrigin, allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));

app.post('/v1/hit', hitRoute);
app.get('/stats', statsRoute);
app.post('/stats/players/:id/rename', renamePlayerRoute);
app.post('/stats/players/:id/delete', deletePlayerRoute);
app.post('/stats/ideas/:id/status', ideaStatusRoute);
app.post('/stats/ideas/:id/delete', deleteIdeaRoute);
app.route('/', accounts);
app.route('/', scores);
app.route('/', push);
app.route('/', ideas);
app.route('/', turn);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(cleanupHits(env.DB, new Date().toISOString().slice(0, 10)));
  },
};
