import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { accounts } from './accounts';
import { cleanupHits, hitRoute } from './hits';
import { scores } from './scores';
import { statsRoute } from './stats';

export type Env = { DB: D1Database; ADMIN_KEY: string; REGISTER_LIMIT: RateLimit };

const ALLOWED_ORIGIN = /^(https:\/\/matej-hron\.github\.io|http:\/\/(localhost|127\.0\.0\.1):\d+)$/;

/** Returns the origin when it may call the API, otherwise '' (no CORS header). Shared by all routes. */
export const checkOrigin = (origin: string): string => (ALLOWED_ORIGIN.test(origin) ? origin : '');

export const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: checkOrigin, allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));

app.post('/v1/hit', hitRoute);
app.get('/stats', statsRoute);
app.route('/', accounts);
app.route('/', scores);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(cleanupHits(env.DB, new Date().toISOString().slice(0, 10)));
  },
};
