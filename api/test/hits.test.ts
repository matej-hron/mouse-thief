import { SELF, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { cleanupHits } from '../src/hits';

const today = () => new Date().toISOString().slice(0, 10);
const body = '{"p":"thief.html","v":"1.18.0","d":"abc123abc123"}';

const post = (b: string) =>
  SELF.fetch('https://api.test/v1/hit', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: b,
  });

const count = async (sql: string, ...args: unknown[]) =>
  (await env.DB.prepare(sql).bind(...args).first<{ n: number }>())!.n;

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM hits_daily'),
    env.DB.prepare('DELETE FROM hits_uniq'),
    env.DB.prepare('DELETE FROM hits_country'),
  ]);
});

describe('POST /v1/hit', () => {
  it('counts a view', async () => {
    expect((await post(body)).status).toBe(204);
    const row = () =>
      env.DB.prepare('SELECT views FROM hits_daily WHERE day = ? AND page = ?')
        .bind(today(), 'thief.html')
        .first<{ views: number }>();
    expect((await row())!.views).toBe(1);
    expect((await post(body)).status).toBe(204);
    expect((await row())!.views).toBe(2);
    expect(await count('SELECT COUNT(*) AS n FROM hits_uniq')).toBe(1);
  });

  it('stores an empty page as index.html', async () => {
    expect((await post('{"p":"","v":"1","d":"abc123abc123"}')).status).toBe(204);
    expect(await count('SELECT views AS n FROM hits_daily WHERE page = ?', 'index.html')).toBe(1);
  });

  it('counts country', async () => {
    const req = (cf?: { country: string }) =>
      new Request('https://api.test/v1/hit', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body,
        ...(cf ? { cf } : {}),
      });
    expect((await worker.fetch(req({ country: 'CZ' }), env)).status).toBe(204);
    expect(await count('SELECT views AS n FROM hits_country WHERE country = ?', 'CZ')).toBe(1);
    expect((await worker.fetch(req(), env)).status).toBe(204);
    expect(await count('SELECT views AS n FROM hits_country WHERE country = ?', 'XX')).toBe(1);
  });

  it('rejects junk', async () => {
    for (const b of [
      '{"p":"Bad Page.html","d":"abc123abc123"}',
      '{"p":"thief.htm","d":"abc123abc123"}',
      '{"p":"thief.html","d":"short"}',
      '{"p":"thief.html","d":"ABCDEFGH12"}',
      '{"p":"thief.html"}',
      'not json',
    ]) {
      expect((await post(b)).status, b).toBe(400);
    }
    expect(await count('SELECT COUNT(*) AS n FROM hits_daily')).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM hits_uniq')).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM hits_country')).toBe(0);
  });
});

describe('cors', () => {
  const preflight = (origin: string) =>
    SELF.fetch('https://api.test/v1/hit', {
      method: 'OPTIONS',
      headers: { origin, 'access-control-request-method': 'POST' },
    });

  it('echoes allowed origins', async () => {
    for (const o of ['https://matej-hron.github.io', 'http://localhost:8000', 'http://127.0.0.1:5500']) {
      const res = await preflight(o);
      expect(res.status).toBe(204);
      expect(res.headers.get('access-control-allow-origin')).toBe(o);
    }
  });

  it('ignores other origins', async () => {
    for (const o of ['https://evil.example', 'https://matej-hron.github.io.evil.example', 'http://localhost.evil.example']) {
      expect((await preflight(o)).headers.get('access-control-allow-origin')).toBeNull();
    }
  });
});

describe('cleanupHits', () => {
  it('drops hits_uniq older than 40 days, keeps the rest', async () => {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind('2026-10-05', 'a.html', 'v1'), // 40 days
      env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind('2026-10-04', 'a.html', 'v2'), // 41 days
      env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind('2026-11-14', 'a.html', 'v3'),
      env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind('2026-01-01', 'a.html', 5),
      env.DB.prepare('INSERT INTO hits_country VALUES (?, ?, ?)').bind('2026-01-01', 'CZ', 5),
    ]);
    await cleanupHits(env.DB, '2026-11-14');
    const { results } = await env.DB.prepare('SELECT vid FROM hits_uniq ORDER BY vid').all<{ vid: string }>();
    expect(results.map((r) => r.vid)).toEqual(['v1', 'v3']);
    expect(await count('SELECT COUNT(*) AS n FROM hits_daily')).toBe(1);
    expect(await count('SELECT COUNT(*) AS n FROM hits_country')).toBe(1);
  });
});
