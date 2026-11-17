import { SELF, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { PW, call, register, resetTables } from './helpers';

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const get = (path: string, init?: RequestInit) => SELF.fetch(`https://api.test${path}`, init);

const post = (path: string, init?: RequestInit) => SELF.fetch(`https://api.test${path}`, { method: 'POST', redirect: 'manual', ...init });
const players = async () => (await env.DB.prepare('SELECT id, name, name_key FROM players ORDER BY id').all()).results;

beforeEach(async () => {
  await resetTables();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM hits_daily'),
    env.DB.prepare('DELETE FROM hits_uniq'),
    env.DB.prepare('DELETE FROM hits_country'),
    env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind(today(), 'thief.html', 7),
    env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind('2020-01-01', 'old-page.html', 99),
    env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind(today(), 'thief.html', 'v1'),
    env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind(today(), 'thief.html', 'v2'),
    env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind(today(), 'other.html', 'v1'),
    env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind(today(), 'other.html', 1),
    env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind(yesterday(), 'thief.html', 3),
    env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind(yesterday(), 'thief.html', 'v1'),
    env.DB.prepare('INSERT INTO hits_country VALUES (?, ?, ?)').bind(today(), 'CZ', 5),
  ]);
});

describe('GET /stats', () => {
  it('rejects a missing or wrong key', async () => {
    expect((await get('/stats')).status).toBe(401);
    expect((await get('/stats?key=nope')).status).toBe(401);
    expect((await get('/stats?key=test-admin-extra')).status).toBe(401);
  });

  it('renders the page for the owner', async () => {
    const res = await get('/stats?key=test-admin');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-robots-tag')).toBe('noindex');
    const html = await res.text();
    expect(html).toContain('PIXEL GAMES STATS');
    expect(html).toContain('thief.html');
    // per page: uniques are distinct across days (thief: v1,v2 -> 2, not 3)
    expect(html).toContain('<tr><td>thief.html</td><td>10</td><td>2</td></tr>');
    expect(html).toContain('<tr><td>other.html</td><td>1</td><td>1</td></tr>');
    // per day: uniques are distinct across pages (today: v1,v2 -> 2, not 3)
    expect(html).toContain(`<tr><td>${today()}</td><td>8</td><td>2</td></tr>`);
    expect(html).toContain(`<tr><td>${yesterday()}</td><td>3</td><td>1</td></tr>`);
    expect(html).toContain('<td>CZ</td>');
    expect(html).not.toContain('old-page.html');
  });

  it('accepts a bearer token', async () => {
    const res = await get('/stats', { headers: { authorization: 'Bearer test-admin' } });
    expect(res.status).toBe(200);
  });

  it('falls back to the bearer token when ?key= is empty', async () => {
    const res = await get('/stats?key=', { headers: { authorization: 'Bearer test-admin' } });
    expect(res.status).toBe(200);
    expect((await get('/stats?key=')).status).toBe(401);
  });

  it('HTML-escapes page and player names', async () => {
    await env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind(today(), '<script>x</script>', 1).run();
    await register();
    await env.DB.prepare("UPDATE players SET name = '<i>HI</i>' WHERE id = '123456'").run();
    const html = await (await get('/stats?key=test-admin')).text();
    expect(html).not.toContain('<script>x');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).not.toContain('<i>HI');
    expect(html).toContain('&lt;i&gt;HI&lt;/i&gt;');
  });
});

describe('player moderation', () => {
  const seed = async () => {
    await register();
    await register({ id: '234567', name: 'BOB', csalt: PW });
    await env.DB.batch([
      env.DB.prepare("INSERT INTO scores (player, board, value, updated) VALUES ('123456', 'stars', 5, 'x')"),
      env.DB.prepare("INSERT INTO scores (player, board, value, updated) VALUES ('234567', 'stars', 6, 'x')"),
      env.DB.prepare("INSERT INTO login_fail (name_key, count, since, locked_until) VALUES ('MIA', 3, 1, 0)"),
      env.DB.prepare("INSERT INTO login_fail (name_key, count, since, locked_until) VALUES ('BOB', 3, 1, 0)"),
    ]);
  };

  it('lists players with name, id and RENAME / DELETE forms', async () => {
    await seed();
    const html = await (await get('/stats?key=test-admin')).text();
    expect(html).toContain('MIA');
    expect(html).toContain('123456');
    expect(html).toContain('action="/stats/players/123456/rename?key=test-admin"');
    expect(html).toContain('action="/stats/players/123456/delete?key=test-admin"');
    expect(html).toContain('RENAME');
    expect(html).toContain('DELETE');
  });

  it('shows only the newest 50 players', async () => {
    const ins = env.DB.prepare("INSERT INTO players (id, name, name_key, created) VALUES (?, ?, ?, ?)");
    await env.DB.batch(
      Array.from({ length: 51 }, (_, i) => ins.bind(String(100001 + i), `N${i}`, `N${i}`, `2026-01-01T00:00:${String(i).padStart(2, '0')}Z`)),
    );
    const html = await (await get('/stats?key=test-admin')).text();
    expect(html).not.toContain('/stats/players/100001/'); // the oldest
    expect(html).toContain('/stats/players/100002/');
    expect(html).toContain('/stats/players/100051/');
  });

  it('rename needs the key', async () => {
    await seed();
    expect((await post('/stats/players/123456/rename')).status).toBe(401);
    expect((await post('/stats/players/123456/rename?key=nope')).status).toBe(401);
    expect((await players())[0]).toMatchObject({ name: 'MIA' });
  });

  it('delete needs the key', async () => {
    await seed();
    expect((await post('/stats/players/123456/delete')).status).toBe(401);
    expect((await post('/stats/players/123456/delete?key=nope')).status).toBe(401);
    expect(await players()).toHaveLength(2);
  });

  it('rename sets name and name_key to P<id> and redirects back', async () => {
    await seed();
    const res = await post('/stats/players/123456/rename?key=test%2Dadmin');
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/stats?key=test-admin');
    expect(await players()).toEqual([
      { id: '123456', name: 'P123456', name_key: 'P123456' },
      { id: '234567', name: 'BOB', name_key: 'BOB' },
    ]);
  });

  it('rename survives P<id> being taken', async () => {
    await seed();
    await env.DB.prepare("UPDATE players SET name_key = 'P123456' WHERE id = '234567'").run();
    const res = await post('/stats/players/123456/rename?key=test-admin');
    expect(res.status).toBe(303);
    expect((await players())[0]).toMatchObject({ id: '123456', name: 'MIA', name_key: 'MIA' });
  });

  it('delete removes player, sessions, scores and login_fail only for that player', async () => {
    await seed();
    const res = await post('/stats/players/123456/delete?key=test-admin');
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/stats?key=test-admin');
    expect((await players()).map((p) => p.id)).toEqual(['234567']);
    const count = async (sql: string) => env.DB.prepare(sql).first('n');
    expect(await count("SELECT COUNT(*) AS n FROM sessions WHERE player = '123456'")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM sessions WHERE player = '234567'")).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM scores WHERE player = '123456'")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM scores WHERE player = '234567'")).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM login_fail WHERE name_key = 'MIA'")).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM login_fail WHERE name_key = 'BOB'")).toBe(1);
  });

  it('moderation responses (401, 400, 303) are no-store and noindex', async () => {
    await seed();
    for (const path of ['/stats/players/123456/rename', '/stats/players/123456/delete?key=nope', '/stats/players/12/delete?key=test-admin', '/stats/players/123456/rename?key=test-admin']) {
      const res = await post(path);
      expect(res.headers.get('cache-control'), path).toBe('no-store');
      expect(res.headers.get('x-robots-tag'), path).toBe('noindex');
    }
  });

  it('unknown id is still a 303; malformed id is a 400', async () => {
    expect((await post('/stats/players/999999/delete?key=test-admin')).status).toBe(303);
    expect((await post('/stats/players/999999/rename?key=test-admin')).status).toBe(303);
    for (const id of ['12345', '1234567', '012345', 'abcdef']) {
      expect((await post(`/stats/players/${id}/delete?key=test-admin`)).status).toBe(400);
    }
  });

  it('a DELETE /v1/me also clears the login_fail row', async () => {
    const t = await register();
    await env.DB.prepare("INSERT INTO login_fail (name_key, count, since, locked_until) VALUES ('MIA', 3, 1, 0)").run();
    expect((await call('DELETE', '/v1/me', undefined, t)).status).toBe(204);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM login_fail').first('n')).toBe(0);
  });
});
