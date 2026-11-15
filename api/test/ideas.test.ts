import { SELF, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { ideaText, titleKey } from '../src/ideas';
import { censor } from '../src/censor';
import { call, code, register, resetTables } from './helpers';

beforeEach(resetTables);

type Idea = { id: number; title: string; body: string; status: string; reply: string; votes: number; created: string; name: string; shape: string; color: number; mine?: true; voted?: true };
type List = { rows: Idea[]; more: boolean; counts: Record<string, number> };

const player = (id: string, name: string) => register({ id, name });
const write = (token: string | undefined, title: string, body?: string) => call('POST', '/v1/ideas', { title, body }, token);
const newId = async (token: string, title: string, body?: string) => ((await (await write(token, title, body)).json()) as { id: number }).id;
const list = async (q = '', token?: string) => {
  const r = await call('GET', '/v1/ideas' + q, undefined, token);
  return { r, j: (await r.json()) as List };
};
const admin = (path: string, form: Record<string, string> = {}) =>
  SELF.fetch(`https://api.test${path}`, { method: 'POST', redirect: 'manual', body: new URLSearchParams(form) });
const setStatus = (id: number, status: string, reply = '') => admin(`/stats/ideas/${id}/status?key=test-admin`, { status, reply });

describe('text', () => {
  it('ideaText keeps what the pixel font draws', () => {
    expect(ideaText('  více   Aut!  ', 40)).toBe('VICE AUT!');
    expect(ideaText('a\nb\tc 😀 ~', 40)).toBe('A B C');
    expect(ideaText('x'.repeat(50), 40)).toHaveLength(40);
    expect(ideaText(undefined, 40)).toBe('');
    expect(titleKey('MORE CARS, PLEASE!')).toBe('MORECARSPLEASE');
  });
  it('censor hides rude words', () => {
    expect(censor('THIS IS SH1T')).toBe('THIS IS ####');
    expect(censor('A CLASS GAME')).toBe('A CLASS GAME');
  });
});

describe('writing ideas', () => {
  it('needs an account', async () => {
    expect((await write(undefined, 'MORE CARS')).status).toBe(401);
  });

  it('stores a cleaned, censored idea', async () => {
    const t = await player('111111', 'AAA');
    const r = await write(t, 'more cars   in pixel gp', 'a fucking fast one');
    expect(r.status).toBe(201);
    const j = (await r.json()) as { id: number; title: string; body: string };
    expect(j.title).toBe('MORE CARS IN PIXEL GP');
    expect(j.body).toBe('A ####### FAST ONE');
    const { j: l } = await list();
    expect(l.rows).toHaveLength(1);
    expect(l.rows[0]).toMatchObject({ id: j.id, title: 'MORE CARS IN PIXEL GP', status: 'untriaged', votes: 0, reply: '', name: 'AAA', shape: 'cat' });
    expect(l.counts).toEqual({ untriaged: 1, accepted: 0, rejected: 0, implemented: 0 });
  });

  it('refuses too short, malformed and duplicate titles', async () => {
    const t = await player('111111', 'AAA');
    expect(await code(await write(t, ' a! '))).toBe('TOO_SHORT');
    expect((await call('POST', '/v1/ideas', { title: 5 }, t)).status).toBe(400);
    expect((await call('POST', '/v1/ideas', { title: 'x'.repeat(401) }, t)).status).toBe(400);
    const id = await newId(t, 'Dark mode');
    const r = await write(await player('222222', 'BBB'), 'DARK-MODE!!');
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: 'DUPLICATE', id });
  });

  it('GET one idea', async () => {
    const a = await player('111111', 'AAA'), b = await player('222222', 'BBB');
    const id = await newId(a, 'DARK MODE', 'please');
    await call('PUT', `/v1/ideas/${id}/vote`, undefined, b);
    const one = async (path: string, t?: string) => call('GET', path, undefined, t);
    expect(await (await one(`/v1/ideas/${id}`, b)).json()).toMatchObject({ id, title: 'DARK MODE', body: 'PLEASE', votes: 1, voted: true, name: 'AAA' });
    expect(await (await one(`/v1/ideas/${id}`, a)).json()).toMatchObject({ mine: true });
    expect((await one('/v1/ideas/999')).status).toBe(404);
  });

  it('allows 3 a day per player', async () => {
    const t = await player('111111', 'AAA');
    for (const n of ['ONE', 'TWO', 'THREE']) expect((await write(t, 'IDEA ' + n)).status).toBe(201);
    const r = await write(t, 'IDEA FOUR');
    expect(r.status).toBe(429);
    expect(await code(r)).toBe('TOO_MANY');
    await env.DB.prepare('UPDATE ideas SET created = ?').bind(new Date(Date.now() - 2 * 86400000).toISOString()).run();
    expect((await write(t, 'IDEA FOUR')).status).toBe(201);
    expect((await write(await player('222222', 'BBB'), 'IDEA FIVE')).status).toBe(201);
  });

  it('the author can take back an idea nobody answered yet', async () => {
    const a = await player('111111', 'AAA'), b = await player('222222', 'BBB');
    const id = await newId(a, 'IDEA ONE'), id2 = await newId(a, 'IDEA TWO');
    expect(await code(await call('DELETE', `/v1/ideas/${id}`, undefined, b))).toBe('NOT_YOURS');
    expect((await call('DELETE', `/v1/ideas/${id}`, undefined, a)).status).toBe(200);
    expect((await call('DELETE', `/v1/ideas/${id}`, undefined, a)).status).toBe(404);
    await setStatus(id2, 'accepted');
    expect(await code(await call('DELETE', `/v1/ideas/${id2}`, undefined, a))).toBe('CLOSED');
  });
});

describe('votes', () => {
  it('one upvote per player, not for your own, recounted', async () => {
    const a = await player('111111', 'AAA'), b = await player('222222', 'BBB'), c = await player('333333', 'CCC');
    const id = await newId(a, 'MORE MAPS');
    expect(await code(await call('PUT', `/v1/ideas/${id}/vote`, undefined, a))).toBe('OWN');
    expect((await call('PUT', `/v1/ideas/${id}/vote`)).status).toBe(401);
    expect(await (await call('PUT', `/v1/ideas/${id}/vote`, undefined, b)).json()).toEqual({ votes: 1, voted: true });
    expect(await (await call('PUT', `/v1/ideas/${id}/vote`, undefined, b)).json()).toEqual({ votes: 1, voted: true });
    expect(await (await call('PUT', `/v1/ideas/${id}/vote`, undefined, c)).json()).toEqual({ votes: 2, voted: true });
    expect(await (await call('DELETE', `/v1/ideas/${id}/vote`, undefined, c)).json()).toEqual({ votes: 1, voted: false });
    const { j } = await list('', b);
    expect(j.rows[0]).toMatchObject({ votes: 1, voted: true });
    expect(j.rows[0]!.mine).toBeUndefined();
    const { j: mine } = await list('', a);
    expect(mine.rows[0]).toMatchObject({ mine: true });
    expect(mine.rows[0]!.voted).toBeUndefined();
    expect((await call('PUT', '/v1/ideas/999/vote', undefined, b)).status).toBe(404);
    expect((await call('PUT', '/v1/ideas/abc/vote', undefined, b)).status).toBe(404);
  });

  it('closed ideas take no votes', async () => {
    const a = await player('111111', 'AAA'), b = await player('222222', 'BBB');
    const id = await newId(a, 'MORE MAPS');
    await setStatus(id, 'accepted');
    expect((await call('PUT', `/v1/ideas/${id}/vote`, undefined, b)).status).toBe(200);
    await setStatus(id, 'implemented');
    expect(await code(await call('DELETE', `/v1/ideas/${id}/vote`, undefined, b))).toBe('CLOSED');
    expect((await list()).j.rows[0]).toMatchObject({ status: 'implemented', votes: 1 });
  });
});

describe('the list', () => {
  it('filters by status and mine, sorts by votes or newest, pages by 6', async () => {
    const a = await player('111111', 'AAA'), b = await player('222222', 'BBB');
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) ids.push(await newId(a, 'A IDEA ' + i));
    for (let i = 0; i < 3; i++) ids.push(await newId(b, 'B IDEA ' + i));
    await env.DB.prepare('UPDATE ideas SET created = ?').bind(new Date(Date.now() - 2 * 86400000).toISOString()).run();
    ids.push(await newId(b, 'B IDEA 3'));
    await call('PUT', `/v1/ideas/${ids[1]}/vote`, undefined, b);
    await setStatus(ids[2]!, 'rejected', 'too much like pixel ski');

    const top = await list();
    expect(top.r.headers.get('cache-control')).toBe('public, max-age=30');
    expect(top.j.rows.map((r) => r.id)).toEqual([ids[1], ids[6], ids[5], ids[4], ids[3], ids[2]]);
    expect(top.j.more).toBe(true);
    expect((await list('?page=1')).j.rows.map((r) => r.id)).toEqual([ids[0]]);
    expect((await list('?sort=new')).j.rows[0]!.id).toBe(ids[6]);
    const rejected = (await list('?status=rejected')).j;
    expect(rejected.rows).toHaveLength(1);
    expect(rejected.rows[0]).toMatchObject({ reply: 'TOO MUCH LIKE PIXEL SKI' });
    expect(rejected.counts).toEqual({ untriaged: 6, accepted: 0, rejected: 1, implemented: 0 });
    expect((await list('?mine=1', a)).j.rows.map((r) => r.id).sort()).toEqual(ids.slice(0, 3).sort());
    expect((await list('?mine=1')).r.status).toBe(401);
    for (const q of ['?status=nope', '?sort=old', '?page=50', '?page=x']) expect((await list(q)).r.status).toBe(400);
  });

  it('deleting a player removes their ideas and votes', async () => {
    const a = await player('111111', 'AAA'), b = await player('222222', 'BBB');
    const ia = await newId(a, 'A IDEA'), ib = await newId(b, 'B IDEA');
    await call('PUT', `/v1/ideas/${ib}/vote`, undefined, a);
    await call('PUT', `/v1/ideas/${ia}/vote`, undefined, b);
    expect((await admin('/stats/players/111111/delete?key=test-admin')).status).toBe(303);
    const rows = (await list()).j.rows;
    expect(rows.map((r) => [r.id, r.votes])).toEqual([[ib, 0]]);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM idea_votes').first('n')).toBe(0);
  });
});

describe('moderation on the stats page', () => {
  it('lists ideas and sets status and reply', async () => {
    const a = await player('111111', 'AAA');
    const id = await newId(a, 'NIGHT MODE', 'for racing at night');
    const html = await (await SELF.fetch('https://api.test/stats?key=test-admin')).text();
    expect(html).toContain(`#${id} NIGHT MODE`);
    expect(html).toContain('FOR RACING AT NIGHT');
    expect(html).toContain(`action="/stats/ideas/${id}/status?key=test-admin"`);

    const r = await setStatus(id, 'implemented', 'in arcade 2.52.0');
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/stats?key=test-admin#ideas');
    expect((await list()).j.rows[0]).toMatchObject({ status: 'implemented', reply: 'IN ARCADE 2.52.0' });
  });

  it('needs the key, a good id and a known status; delete removes the idea', async () => {
    const a = await player('111111', 'AAA'), b = await player('222222', 'BBB');
    const id = await newId(a, 'NIGHT MODE');
    await call('PUT', `/v1/ideas/${id}/vote`, undefined, b);
    expect((await admin(`/stats/ideas/${id}/status`, { status: 'accepted' })).status).toBe(401);
    expect((await admin(`/stats/ideas/${id}/status?key=nope`, { status: 'accepted' })).status).toBe(401);
    expect((await admin(`/stats/ideas/x1/status?key=test-admin`, { status: 'accepted' })).status).toBe(400);
    expect((await setStatus(id, 'maybe')).status).toBe(400);
    expect((await admin(`/stats/ideas/${id}/delete`)).status).toBe(401);
    expect((await admin(`/stats/ideas/${id}/delete?key=test-admin`)).status).toBe(303);
    expect((await list()).j.rows).toEqual([]);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM idea_votes').first('n')).toBe(0);
  });
});
