import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { boardRule } from '../src/boards';
import { call, register, resetTables } from './helpers';

beforeEach(resetTables);

type Row = { rank: number; name: string; shape: string; color: number; value: number; me?: true };
type Board = { board: string; rows: Row[]; me: { rank: number; value: number } | null };

const post = (token: string | undefined, ...scores: { b: string; v: unknown }[]) => call('POST', '/v1/scores', { scores }, token);
const board = async (name: string, token?: string, page = 0) => {
  const r = await call('GET', `/v1/boards/${name}?page=${page}`, undefined, token);
  return { r, j: (await r.json()) as Board };
};
const stored = (player: string, b: string) =>
  env.DB.prepare('SELECT value FROM scores WHERE player = ? AND board = ?').bind(player, b).first<number>('value');
const seed = (player: string, b: string, value: number, updated: string) =>
  env.DB.prepare('INSERT INTO scores (player, board, value, updated) VALUES (?, ?, ?, ?)').bind(player, b, value, updated).run();
const player = (id: string, name: string) => register({ id, name });

describe('boardRule', () => {
  it('resolves exact, plain and track boards', () => {
    expect(boardRule('stars')).toMatchObject({ better: 'higher', min: 0, max: 10_000_000 });
    expect(boardRule('bike:free')).toMatchObject({ better: 'higher' });
    expect(boardRule('bike:t1')).toMatchObject({ better: 'lower', min: 3, max: 3600 });
    expect(boardRule('skygp')).toBeNull();
    expect(boardRule('stars:x')).toBeNull();
    expect(boardRule('skygp:Bad')).toBeNull();
    expect(boardRule('skygp:' + 'a'.repeat(25))).toBeNull();
    expect(boardRule('nosuch')).toBeNull();
  });
});

describe('scores', () => {
  it('scores need a token', async () => {
    expect((await post(undefined, { b: 'stars', v: 1 })).status).toBe(401);
  });

  it('keeps the better value', async () => {
    const t = await player('111111', 'AAA');
    for (const [v, want] of [[50, 50], [40, 50], [60, 60]]) {
      expect(await (await post(t, { b: 'stars', v })).json()).toEqual({ saved: 1 });
      expect(await stored('111111', 'stars')).toBe(want);
    }
    for (const [v, want] of [[30.5, 30.5], [31, 30.5], [29, 29]]) {
      await post(t, { b: 'racer', v });
      expect(await stored('111111', 'racer')).toBe(want);
    }
  });

  it('rejects out-of-range and unknown boards', async () => {
    const t = await player('111111', 'AAA');
    const r = await post(t, { b: 'racer', v: 2 }, { b: 'nosuch', v: 5 }, { b: 'thief:x', v: 5 }, { b: 'stars', v: NaN },
      { b: 'stars', v: '7' }, { b: 'stars', v: -1 }, { b: 'stars', v: 10_000_001 }, { b: 'racer', v: 5 }, { b: 'stars', v: 10_000_000 });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ saved: 2 });
    expect(await stored('111111', 'racer')).toBe(5);
    expect(await stored('111111', 'stars')).toBe(10_000_000);
  });

  it('track boards', async () => {
    const t = await player('111111', 'AAA');
    expect(await (await post(t, { b: 'skygp:t1', v: 40 }, { b: 'skygp', v: 40 })).json()).toEqual({ saved: 1 });
  });

  it('more than 60 items is BAD, malformed bodies too', async () => {
    const t = await player('111111', 'AAA');
    const many = Array.from({ length: 61 }, () => ({ b: 'stars', v: 1 }));
    const r = await post(t, ...many);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'BAD' });
    expect((await post(t, ...many.slice(0, 60))).status).toBe(200);
    expect((await call('POST', '/v1/scores', { nope: 1 }, t)).status).toBe(400);
  });
});

describe('boards', () => {
  it('unknown board is 404', async () => {
    expect((await board('nosuch')).r.status).toBe(404);
    expect((await board('skygp')).r.status).toBe(404);
  });

  it('orders higher desc and lower asc, ties by earlier updated', async () => {
    for (const [id, n] of [['111111', 'AAA'], ['222222', 'BBB'], ['333333', 'CCC']] as const) await player(id, n);
    await seed('111111', 'stars', 10, '2026-01-02');
    await seed('222222', 'stars', 20, '2026-01-03');
    await seed('333333', 'stars', 10, '2026-01-01');
    const hi = (await board('stars')).j;
    expect(hi.rows.map((x) => [x.rank, x.name, x.value])).toEqual([[1, 'BBB', 20], [2, 'CCC', 10], [3, 'AAA', 10]]);
    await seed('111111', 'racer', 30, '2026-01-02');
    await seed('222222', 'racer', 20, '2026-01-03');
    await seed('333333', 'racer', 30, '2026-01-01');
    expect((await board('racer')).j.rows.map((x) => x.name)).toEqual(['BBB', 'CCC', 'AAA']);
  });

  it('me row and me flag with token, even outside the top page', async () => {
    const t = await player('100000'.replace('0', '1'), 'ME');
    for (let i = 0; i < 12; i++) {
      await player(String(200000 + i), `P${String.fromCharCode(65 + i)}`);
      await seed(String(200000 + i), 'stars', 100 + i, '2026-01-01');
    }
    await seed('100000'.replace('0', '1'), 'stars', 5, '2026-01-01');
    const anon = (await board('stars')).j;
    expect(anon.me).toBeNull();
    expect(anon.rows.some((x) => x.me)).toBe(false);
    const mine = (await board('stars', t, 0)).j;
    expect(mine.me).toEqual({ rank: 13, value: 5 });
    expect(mine.rows).toHaveLength(10);
    expect(mine.rows.some((x) => x.me)).toBe(false);
    const last = (await board('stars', t, 1)).j;
    expect(last.rows.map((x) => x.rank)).toEqual([11, 12, 13]);
    expect(last.rows[2]).toMatchObject({ name: 'ME', value: 5, me: true });
    // tie with an earlier updated ranks behind it
    await seed('200000', 'racer', 9, '2026-01-01');
    await seed('100000'.replace('0', '1'), 'racer', 9, '2026-01-02');
    expect((await board('racer', t)).j.me).toEqual({ rank: 2, value: 9 });
    // no score on a board -> null; bad token -> treated as anonymous
    expect((await board('hook', t)).j.me).toBeNull();
    expect((await board('stars', 'f'.repeat(64))).j.me).toBeNull();
  });

  it('pages of 10 up to 5 pages, bad page is BAD', async () => {
    await player('111111', 'AAA');
    for (let i = 0; i < 55; i++) {
      await player(String(300000 + i), `Q${i}`);
      await seed(String(300000 + i), 'stars', 1000 - i, '2026-01-01');
    }
    const p4 = (await board('stars', undefined, 4)).j;
    expect(p4.rows.map((x) => x.rank)).toEqual([41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
    expect((await call('GET', '/v1/boards/stars?page=5')).status).toBe(400);
    expect((await call('GET', '/v1/boards/stars?page=x')).status).toBe(400);
  });

  it('no ids in rows', async () => {
    await player('111111', 'AAA');
    await seed('111111', 'stars', 10, '2026-01-01');
    const t = await (await call('GET', '/v1/boards/stars')).text();
    expect(t).not.toContain('111111');
    expect(JSON.parse(t).rows[0]).toEqual({ rank: 1, name: 'AAA', shape: 'cat', color: 3, value: 10 });
  });

  it('cache header only without auth', async () => {
    const t = await player('111111', 'AAA');
    expect((await board('stars')).r.headers.get('cache-control')).toBe('public, max-age=30');
    expect((await board('stars', t)).r.headers.get('cache-control')).toBeNull();
  });
});
