import { SELF, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';

const today = () => new Date().toISOString().slice(0, 10);
const get = (path: string, init?: RequestInit) => SELF.fetch(`https://api.test${path}`, init);

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM hits_daily'),
    env.DB.prepare('DELETE FROM hits_uniq'),
    env.DB.prepare('DELETE FROM hits_country'),
    env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind(today(), 'thief.html', 7),
    env.DB.prepare('INSERT INTO hits_daily VALUES (?, ?, ?)').bind('2020-01-01', 'old-page.html', 99),
    env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind(today(), 'thief.html', 'v1'),
    env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind(today(), 'thief.html', 'v2'),
    env.DB.prepare('INSERT INTO hits_uniq VALUES (?, ?, ?)').bind(today(), 'other.html', 'v1'),
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
    expect(html).toContain('PIXEL ARCADE STATS');
    expect(html).toContain('thief.html');
    expect(html).toContain('<td>7</td><td>2</td>'); // views, uniques
    expect(html).toContain('<td>CZ</td>');
    expect(html).not.toContain('old-page.html');
  });

  it('accepts a bearer token', async () => {
    const res = await get('/stats', { headers: { authorization: 'Bearer test-admin' } });
    expect(res.status).toBe(200);
  });
});
