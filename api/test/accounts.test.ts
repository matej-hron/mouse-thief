import { SELF, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { sha256hex } from '../src/auth';
import { cleanName, badName } from '../src/names';
import worker from '../src/index';
import { H, PW, RPW, call, code, login, reg, register, resetTables } from './helpers';

beforeEach(resetTables);

describe('names', () => {
  it('cleanName mirrors the client', () => {
    expect(cleanName('  mia  the-cat!! 12345 ')).toBe('MIA THECAT');
    expect(badName('Ku rva')).toBe(true);
    expect(badName('MIA')).toBe(false);
  });
});

describe('accounts', () => {
  it('register then login', async () => {
    const r = await reg();
    expect(r.status).toBe(201);
    const { token } = (await r.json()) as { token: string };
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const l = await login();
    expect(l.status).toBe(200);
    const j = (await l.json()) as Record<string, unknown>;
    expect(j).toMatchObject({ id: '123456', name: 'MIA', avatar: { shape: 'cat', color: 3 } });
    expect(j.token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('register NAME_TAKEN ignoring case and spaces', async () => {
    await register({ name: 'AB CD' });
    const r = await reg({ id: '222222', name: 'ABCD' });
    expect(r.status).toBe(409);
    expect(await code(r)).toBe('NAME_TAKEN');
  });

  it('register ID_TAKEN', async () => {
    await register();
    const r = await reg({ name: 'OTHER' });
    expect(r.status).toBe(409);
    expect(await code(r)).toBe('ID_TAKEN');
  });

  it('register NAME_BAD', async () => {
    for (const name of ['KURVA', 'FUCK1']) {
      const r = await reg({ name });
      expect(r.status).toBe(422);
      expect(await code(r)).toBe('NAME_BAD');
    }
  });

  it('register BAD on malformed hex', async () => {
    for (const over of [{ pw: 'xyz' }, { csalt: H('g') }, { rpw: 'ab' }, { id: '012345' }, { name: 'mia' }, { avatar: { shape: 'cat', color: 10 } }]) {
      const r = await reg(over);
      expect(r.status).toBe(400);
      expect(await code(r)).toBe('BAD');
    }
  });

  it('prelogin returns the salts', async () => {
    await register();
    const r = await call('POST', '/v1/prelogin', { name: 'mia' });
    expect(await r.json()).toEqual({ csalt: H('1'), rsalt: H('2') });
    const none = await call('POST', '/v1/prelogin', { name: 'NOBODY' });
    expect(none.status).toBe(404);
    expect(await code(none)).toBe('NO_PLAYER');
  });

  it('login WRONG', async () => {
    await register();
    const r = await login('MIA', H('c'));
    expect(r.status).toBe(401);
    expect(await code(r)).toBe('WRONG');
    expect((await login('NOBODY')).status).toBe(404);
  });

  it('login locks after 10 failures for 15 minutes', async () => {
    await register();
    for (let i = 0; i < 10; i++) expect((await login('MIA', H('c'))).status).toBe(401);
    const locked = await login();
    expect(locked.status).toBe(429);
    expect(await code(locked)).toBe('LOCKED');
    // the lock started at the 10th failure and lasts 15 minutes (10 s short of that it still holds: a margin, so a
    // slow test run crossing a second or two can't end the lock early)
    await env.DB.prepare('UPDATE login_fail SET since = since - 890, locked_until = locked_until - 890').run();
    expect((await login()).status).toBe(429);
    await env.DB.prepare('UPDATE login_fail SET since = since - 12, locked_until = locked_until - 12').run();
    expect((await login()).status).toBe(200);
    // a success reset the counter: 9 more failures do not lock
    for (let i = 0; i < 9; i++) await login('MIA', H('c'));
    expect((await login()).status).toBe(200);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM login_fail').first('n')).toBe(0);
  });

  it('the lock starts at the 10th failure, not the first', async () => {
    await register();
    for (let i = 0; i < 9; i++) await login('MIA', H('c'));
    await env.DB.prepare('UPDATE login_fail SET since = since - 899').run(); // first failure was 14m59s ago
    expect((await login('MIA', H('c'))).status).toBe(401); // the 10th starts the lock
    await env.DB.prepare('UPDATE login_fail SET since = since - 300, locked_until = locked_until - 300').run();
    expect((await login()).status).toBe(429); // 15m+ after the first failure, but only 5m into the lock
  });

  it('parallel wrong guesses cannot bypass the throttle', async () => {
    await register();
    const rs = await Promise.all(Array.from({ length: 20 }, () => login('MIA', H('c'))));
    expect(rs.filter((r) => r.status === 401).length).toBeLessThanOrEqual(10);
    expect((await login()).status).toBe(429);
  });

  it('register is rate limited per client (SLOW_DOWN)', async () => {
    const keys: string[] = [];
    let left = 5;
    const stub = { limit: async ({ key }: { key: string }) => (keys.push(key), { success: left-- > 0 }) };
    const send = (id: string, name: string) =>
      worker.fetch(
        new Request('https://api.test/v1/register', {
          method: 'POST',
          headers: { 'cf-connecting-ip': '203.0.113.7' },
          body: JSON.stringify({ id, name, avatar: { shape: 'cat', color: 3 }, csalt: H('1'), pw: PW, rsalt: H('2'), rpw: RPW }),
        }),
        { ...env, REGISTER_LIMIT: stub } as never,
        { waitUntil() {}, passThroughOnException() {} } as never,
      );
    for (let i = 0; i < 5; i++) expect((await send(`10000${i}`, `KID ${i}`)).status).toBe(201);
    const r = await send('100009', 'KID 9');
    expect(r.status).toBe(429);
    expect(await code(r)).toBe('SLOW_DOWN');
    expect(new Set(keys)).toEqual(new Set(['203.0.113.7']));
  });

  it('reset with recovery code drops other sessions', async () => {
    const old = await register();
    const bad = await call('POST', '/v1/reset', { name: 'MIA', rpw: H('c'), csalt: H('3'), pw: H('d') });
    expect(bad.status).toBe(401);
    const r = await call('POST', '/v1/reset', { name: 'MIA', rpw: RPW, csalt: H('3'), pw: H('d') });
    expect(r.status).toBe(200);
    const { token } = (await r.json()) as { token: string };
    expect((await call('GET', '/v1/me', undefined, old)).status).toBe(401);
    expect((await call('GET', '/v1/me', undefined, token)).status).toBe(200);
    expect((await login('MIA', PW)).status).toBe(401);
    expect((await login('MIA', H('d'))).status).toBe(200);
    expect(((await (await call('POST', '/v1/prelogin', { name: 'MIA' })).json()) as { csalt: string }).csalt).toBe(H('3'));
  });

  it('wrong recovery codes are throttled like logins', async () => {
    await register();
    for (let i = 0; i < 10; i++) await call('POST', '/v1/reset', { name: 'MIA', rpw: H('c'), csalt: H('3'), pw: H('d') });
    const r = await call('POST', '/v1/reset', { name: 'MIA', rpw: RPW, csalt: H('3'), pw: H('d') });
    expect(r.status).toBe(429);
    expect((await call('POST', '/v1/prelogin', { name: 'MIA' })).status).toBe(429);
  });

  it('me needs a token', async () => {
    const r = await call('GET', '/v1/me');
    expect(r.status).toBe(401);
    expect(await code(r)).toBe('AUTH');
    expect((await call('GET', '/v1/me', undefined, H('e'))).status).toBe(401);
    const t = await register();
    expect(await (await call('GET', '/v1/me', undefined, t)).json()).toEqual({ id: '123456', name: 'MIA', avatar: { shape: 'cat', color: 3 } });
  });

  it('PUT me renames, NAME_TAKEN', async () => {
    const t = await register();
    await register({ id: '654321', name: 'ZOE' });
    const r = await call('PUT', '/v1/me', { name: 'MIA 2', avatar: { shape: 'dog', color: 1 } }, t);
    expect(await r.json()).toEqual({ id: '123456', name: 'MIA 2', avatar: { shape: 'dog', color: 1 } });
    expect((await login('MIA2')).status).toBe(200);
    const taken = await call('PUT', '/v1/me', { name: 'zoe'.toUpperCase() }, t);
    expect(taken.status).toBe(409);
    expect(await code(taken)).toBe('NAME_TAKEN');
    expect((await call('PUT', '/v1/me', { name: 'KURVA' }, t)).status).toBe(422);
    expect((await call('PUT', '/v1/me', { avatar: { shape: 'cat', color: 2 } }, t)).status).toBe(200);
    expect((await call('PUT', '/v1/me', { name: 'MIA 2' }, t)).status).toBe(200);
  });

  it('password change keeps this session, drops others', async () => {
    const t1 = await register();
    const t2 = ((await (await login()).json()) as { token: string }).token;
    const r = await call('POST', '/v1/password', { csalt: H('4'), pw: H('f') }, t1);
    expect(r.status).toBe(204);
    expect((await call('GET', '/v1/me', undefined, t1)).status).toBe(200);
    expect((await call('GET', '/v1/me', undefined, t2)).status).toBe(401);
    expect((await login('MIA', PW)).status).toBe(401);
    expect((await login('MIA', H('f'))).status).toBe(200);
  });

  it('DELETE me removes player, sessions and scores', async () => {
    const t = await register();
    await env.DB.prepare("INSERT INTO scores (player, board, value, updated) VALUES ('123456', 'stars', 5, 'x')").run();
    expect((await call('DELETE', '/v1/me', undefined, t)).status).toBe(204);
    for (const tbl of ['players', 'sessions', 'scores']) {
      expect(await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${tbl}`).first('n')).toBe(0);
    }
  });

  it('DELETE session logs out', async () => {
    const t = await register();
    expect((await call('DELETE', '/v1/session', undefined, t)).status).toBe(204);
    expect((await call('GET', '/v1/me', undefined, t)).status).toBe(401);
  });

  it('server stores only sha256(ssalt+pw)', async () => {
    const t = await register();
    const row = (await env.DB.prepare('SELECT * FROM players').first<Record<string, string>>())!;
    expect(row.pw).not.toBe(PW);
    expect(row.pw).toBe(await sha256hex(row.ssalt + PW));
    expect(row.rpw).toBe(await sha256hex(row.rssalt + RPW));
    expect(row.ssalt).toMatch(/^[0-9a-f]{32}$/);
    const s = (await env.DB.prepare('SELECT token_hash FROM sessions').first<{ token_hash: string }>())!;
    expect(s.token_hash).toBe(await sha256hex(t));
  });

  it('cors allows Authorization, PUT and DELETE', async () => {
    const r = await SELF.fetch('https://api.test/v1/me', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:8000', 'access-control-request-method': 'DELETE', 'access-control-request-headers': 'authorization,content-type' },
    });
    expect(r.headers.get('access-control-allow-methods')).toMatch(/PUT.*DELETE|DELETE.*PUT/);
    expect(r.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('authorization');
  });
});

describe('accounts by id (a phone that knows the account logs in by its ID, so a rename elsewhere cannot lose it)', () => {
  const byId = (pw = PW, id = '123456') => call('POST', '/v1/login', { id, pw });

  it('prelogin and login by id', async () => {
    await register();
    expect(await (await call('POST', '/v1/prelogin', { id: '123456' })).json()).toEqual({ csalt: H('1'), rsalt: H('2') });
    const r = await byId();
    expect(r.status).toBe(200);
    const j = (await r.json()) as Record<string, unknown>;
    expect(j).toMatchObject({ id: '123456', name: 'MIA', avatar: { shape: 'cat', color: 3 } });
    expect(j.token).toMatch(/^[0-9a-f]{64}$/);
    expect((await byId(H('c'))).status).toBe(401);
    const none = await call('POST', '/v1/prelogin', { id: '999999' });
    expect(none.status).toBe(404);
    expect(await code(none)).toBe('NO_PLAYER');
    expect(await code(await byId(PW, '999999'))).toBe('NO_PLAYER');
  });

  it('login by id still works after the player was renamed', async () => {
    const t = await register();
    expect((await call('PUT', '/v1/me', { name: 'MIA 2' }, t)).status).toBe(200);
    expect((await login('MIA')).status).toBe(404);
    const r = await byId();
    expect(r.status).toBe(200);
    expect(((await r.json()) as { name: string }).name).toBe('MIA 2');
  });

  it('reset by id works and returns the id', async () => {
    await register();
    const r = await call('POST', '/v1/reset', { id: '123456', rpw: RPW, csalt: H('3'), pw: H('d') });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { token: string; id: string };
    expect(j.id).toBe('123456');
    expect(j.token).toMatch(/^[0-9a-f]{64}$/);
    expect((await byId(H('d'))).status).toBe(200);
    // and by name it gives the id too
    const n = await call('POST', '/v1/reset', { name: 'MIA', rpw: RPW, csalt: H('5'), pw: H('e') });
    expect(((await n.json()) as { id: string }).id).toBe('123456');
  });

  it('exactly one of name or id', async () => {
    await register();
    for (const path of ['/v1/prelogin', '/v1/login', '/v1/reset']) {
      const extra = path === '/v1/prelogin' ? {} : path === '/v1/login' ? { pw: PW } : { rpw: RPW, csalt: H('3'), pw: H('d') };
      for (const who of [{ name: 'MIA', id: '123456' }, {}, { id: '012345' }, { id: 123456 }]) {
        const r = await call('POST', path, { ...who, ...extra });
        expect(r.status, path + ' ' + JSON.stringify(who)).toBe(400);
        expect(await code(r)).toBe('BAD');
      }
    }
  });

  it('id logins are throttled like name logins, on the same counter', async () => {
    await register();
    for (let i = 0; i < 10; i++) expect((await byId(H('c'))).status).toBe(401);
    const locked = await byId();
    expect(locked.status).toBe(429);
    expect(await code(locked)).toBe('LOCKED');
    expect((await login()).status).toBe(429);
    expect((await call('POST', '/v1/prelogin', { id: '123456' })).status).toBe(429);
  });
});
