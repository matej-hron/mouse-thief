import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/index';
import { ALL_PER_DAY, MAX_TURNS, answerText, parseReply } from '../src/npc';
import { NPCS } from '../src/npcs';
import { resetTables } from './helpers';

// The tests never call the real Workers AI: the AI binding is a stand-in that answers like a chat model would.
const post = (body: unknown, bindings: Record<string, unknown> = {}) =>
  app.request('https://api.test/v1/npc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, { ...env, ...bindings });
const ok = {
  npc: 'malrec', lang: 'cs', hero: { name: 'Bran', cls: 'fighter', g: 'm' }, facts: { knowsBrother: true },
  messages: [{ from: 'player', text: 'Tvůj bratr by tohle nechtěl.' }],
};
const seen: Record<string, unknown>[] = [];
const fakeAi = (content: string) => ({ run: async (_model: string, inputs: Record<string, unknown>) => { seen.push(inputs); return { choices: [{ message: { content } }] }; } });
const GOOD = '{"say": "Tobin... *hlas se mu zlomí*", "persuasion": 3, "mood": "moved", "reveal": ["tobin", "x"], "end": false}';
const KEY = { AI: fakeAi(GOOD) };

describe('POST /v1/npc', () => {
  beforeEach(() => resetTables());

  it('is off without the AI binding, or when turned off', async () => {
    expect((await post(ok, { AI: undefined, NPC_OFF: '1' })).status).toBe(503);
    const r = await post(ok, { AI: undefined });
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

describe('POST /v1/npc with a model', () => {
  beforeEach(() => resetTables());

  it('answers as the character, with the sheet, the scene note and the player\'s words (censored)', async () => {
    seen.length = 0;
    const r = await post({ ...ok, messages: [{ from: 'player', text: 'Ty kreténe, pusť ji!' }] }, KEY);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ say: 'Tobin... *hlas se mu zlomí*', persuasion: 3, mood: 'moved', reveal: ['tobin'], end: false });
    const msgs = seen[0]!.messages as { role: string; content: string }[];
    expect(msgs[0]!.role).toBe('system');
    expect(msgs[0]!.content).toContain('BROTHER MALREC');
    expect(msgs[0]!.content).toContain('they heard in the village about your drowned brother');
    expect(msgs[1]!.content).toContain('Bran: Ty #######, pusť ji!');
    expect(msgs[1]!.content).toContain('language cs');
    expect(seen[0]!.response_format).toMatchObject({ type: 'json_schema' });
  });

  it('a model that answers nonsense is an error, not a crash', async () => {
    expect((await post(ok, { AI: fakeAi('Sorry, I cannot.') })).status).toBe(502);
    expect((await post(ok, { AI: { run: async () => { throw new Error('down'); } } })).status).toBe(502);
  });

  it('counts the answers of the day', async () => {
    await post(ok, KEY); await post(ok, KEY);
    const all = await env.DB.prepare("SELECT n FROM npc_usage WHERE k = 'all'").first<{ n: number }>();
    expect(all!.n).toBe(2);
  });
});

describe('the inn', () => {
  beforeEach(() => resetTables());
  it('every patron answers, with their own sheet and the inn around them', async () => {
    for (const [npc, name] of [['elva', 'OLD ELVA'], ['hollis', 'HOLLIS'], ['brannock', 'BRANNOCK'], ['garth', 'GARTH'], ['oren', 'OREN']] as const) {
      seen.length = 0;
      const r = await post({ ...ok, npc, facts: { boughtDrink: true, milaLost: false, won: false } }, KEY);
      expect(r.status).toBe(200);
      const sys = (seen[0]!.messages as { content: string }[])[0]!.content;
      expect(sys).toContain(name);
      expect(sys).toContain('Crooked Lantern');
      if (npc === 'garth') expect(sys).toContain('just bought you a drink');
    }
  });
});

describe('answerText', () => {
  it('reads both shapes of model output', () => {
    expect(answerText({ choices: [{ message: { content: 'a' } }] })).toBe('a');
    expect(answerText({ response: 'b' })).toBe('b');
    expect(answerText({ response: { say: 'c' } })).toBe('{"say":"c"}');
    expect(answerText(null)).toBe('');
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
