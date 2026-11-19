import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/index';
import { ALL_PER_DAY, MAX_TURNS, parseReply } from '../src/npc';
import { NPCS } from '../src/npcs';
import { resetTables } from './helpers';

// The route talks to Claude only with the ANTHROPIC_API_KEY secret; the tests never call the real API.
const post = (body: unknown, bindings: Record<string, unknown> = {}) =>
  app.request('https://api.test/v1/npc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, { ...env, ...bindings });
const ok = {
  npc: 'malrec', lang: 'cs', hero: { name: 'Bran', cls: 'fighter', g: 'm' }, facts: { knowsBrother: true },
  messages: [{ from: 'player', text: 'Tvůj bratr by tohle nechtěl.' }],
};
const KEY = { ANTHROPIC_API_KEY: 'test-key-not-real' };

describe('POST /v1/npc', () => {
  beforeEach(() => resetTables());

  it('is off without the API key', async () => {
    const r = await post(ok);
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ error: 'npc_off' });
  });

  it('checks the request before anything costs money', async () => {
    expect((await post({ ...ok, lang: 'de' }, KEY)).status).toBe(400);
    expect((await post({ ...ok, npc: 'nobody' }, KEY)).status).toBe(404);
    expect((await post({ ...ok, messages: [{ from: 'npc', text: 'Ahoj.' }] }, KEY)).status).toBe(400);
    expect((await post({ ...ok, messages: [{ from: 'player', text: 'x'.repeat(301) }] }, KEY)).status).toBe(400);
    const long = Array.from({ length: MAX_TURNS + 1 }, (_, i) => [{ from: 'player', text: 'Ahoj ' + i }, { from: 'npc', text: '...' }]).flat().slice(0, -1);
    expect((await post({ ...ok, messages: long }, KEY)).status).toBe(400);
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM npc_usage').first<{ n: number }>();
    expect(n!.n).toBe(0);
  });

  it('stops when everybody together used up the day', async () => {
    const day = new Date().toISOString().slice(0, 10);
    await env.DB.prepare('INSERT INTO npc_usage (day, k, n) VALUES (?, ?, ?)').bind(day, 'all', ALL_PER_DAY).run();
    const r = await post(ok, KEY);
    expect(r.status).toBe(429);
    expect(await r.json()).toEqual({ error: 'limit' });
  });
});

describe('parseReply', () => {
  const reveals = NPCS.malrec!.reveals;
  it('reads the JSON answer, keeping only known secrets', () => {
    const r = parseReply('{"say": "Tobin...", "persuasion": 2, "mood": "softening", "reveal": ["tobin", "made-up"], "end": false}', reveals);
    expect(r).toEqual({ say: 'Tobin...', persuasion: 2, mood: 'softening', reveal: ['tobin'], end: false });
  });
  it('finds the object in text around it', () => {
    expect(parseReply('Here: {"say": "Ne.", "persuasion": 0, "mood": "hostile", "reveal": [], "end": true} ok', reveals)!.end).toBe(true);
  });
  it('refuses what is not a valid answer', () => {
    expect(parseReply('no json here', reveals)).toBeNull();
    expect(parseReply('{"say": "x", "persuasion": 7, "mood": "wary", "reveal": [], "end": false}', reveals)).toBeNull();
    expect(parseReply('{"say": "x", "persuasion": 1, "mood": "happy", "reveal": [], "end": false}', reveals)).toBeNull();
  });
});
