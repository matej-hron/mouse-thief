import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_SAVE } from '../src/saves';
import { call, register, resetTables } from './helpers';

beforeEach(resetTables);

const put = (t: string | undefined, base: number, data: string) => call('PUT', '/v1/save', { base, data }, t);
const get = (t?: string) => call('GET', '/v1/save', undefined, t);

describe('cloud save', () => {
  it('needs a token', async () => {
    expect((await get()).status).toBe(401);
    expect((await put(undefined, 0, 'x')).status).toBe(401);
  });

  it('starts empty, then keeps every save with a new rev', async () => {
    const t = await register();
    const r0 = await get(t);
    expect(r0.status).toBe(404);
    expect(await r0.json()).toEqual({ error: 'NO_SAVE' });
    const r1 = await put(t, 0, 'one');
    expect(r1.status).toBe(200);
    expect(await r1.json()).toMatchObject({ rev: 1 });
    expect(await put(t, 1, 'two').then((r) => r.json())).toMatchObject({ rev: 2 });
    expect(await (await get(t)).json()).toMatchObject({ rev: 2, data: 'two' });
  });

  it('refuses a save on top of an old rev (another phone saved first)', async () => {
    const t = await register();
    await put(t, 0, 'phone A');
    const again = await put(t, 0, 'phone B');
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({ error: 'CONFLICT', rev: 1 });
    await put(t, 1, 'phone A 2');
    const stale = await put(t, 1, 'phone B 2');
    expect(await stale.json()).toEqual({ error: 'CONFLICT', rev: 2 });
    const ahead = await put(t, 7, 'from the future');
    expect(await ahead.json()).toEqual({ error: 'CONFLICT', rev: 2 });
    expect(await (await get(t)).json()).toMatchObject({ rev: 2, data: 'phone A 2' });
  });

  it('a save on top of nothing, but with a base, is a conflict', async () => {
    const t = await register();
    expect(await (await put(t, 3, 'x')).json()).toEqual({ error: 'CONFLICT', rev: 0 });
  });

  it('every player has their own', async () => {
    const a = await register({ id: '111111', name: 'AAA' }), b = await register({ id: '222222', name: 'BBB' });
    await put(a, 0, 'aaa');
    expect((await get(b)).status).toBe(404);
    await put(b, 0, 'bbb');
    expect(await (await get(a)).json()).toMatchObject({ data: 'aaa' });
  });

  it('rejects bad and too big bodies', async () => {
    const t = await register();
    expect((await put(t, -1, 'x')).status).toBe(400);
    expect((await put(t, 0, '')).status).toBe(400);
    expect((await call('PUT', '/v1/save', { base: 0 }, t)).status).toBe(400);
    const big = await put(t, 0, 'x'.repeat(MAX_SAVE + 1));
    expect(big.status).toBe(413);
    expect(await big.json()).toEqual({ error: 'TOO_BIG' });
    expect((await put(t, 0, 'x'.repeat(MAX_SAVE))).status).toBe(200);
  });

  it('goes with the player when they are deleted', async () => {
    const t = await register();
    await put(t, 0, 'mine');
    expect((await call('DELETE', '/v1/me', undefined, t)).status).toBe(204);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM saves').first<number>('n')).toBe(0);
  });
});
