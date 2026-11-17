import { env } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { noteFor } from '../src/push';
import { b64url, encrypt, fromB64url, vapidAuth } from '../src/webpush';
import { call, register, resetTables } from './helpers';

beforeEach(resetTables);
afterEach(() => vi.restoreAllMocks());

const enc = new TextEncoder();

/** A browser's side of a subscription: its ECDH key pair and auth secret. */
async function browser() {
  const kp = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  const pub = new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer);
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return { kp, p256dh: b64url(pub), auth: b64url(auth) };
}

const hkdf = async (salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, n: number) =>
  new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']),
      n * 8,
    ),
  );

/** What the browser does with a push (RFC 8291), to check the server's encryption. */
async function decrypt(b: Awaited<ReturnType<typeof browser>>, body: Uint8Array): Promise<string> {
  const salt = body.slice(0, 16);
  const idlen = body[20]!;
  const asPublic = body.slice(21, 21 + idlen);
  const sealed = body.slice(21 + idlen);
  const as = await crypto.subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: as } as unknown as SubtleCryptoDeriveKeyAlgorithm, b.kp.privateKey, 256));
  const ua = fromB64url(b.p256dh);
  const info = new Uint8Array([...enc.encode('WebPush: info\0'), ...ua, ...asPublic]);
  const ikm = await hkdf(fromB64url(b.auth), shared, info, 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, sealed));
  expect(plain[plain.length - 1]).toBe(2);
  return new TextDecoder().decode(plain.slice(0, -1));
}

const FCM = 'https://fcm.googleapis.com/fcm/send/abc';
const subscribe = async (token: string, endpoint = FCM) => {
  const b = await browser();
  const r = await call('POST', '/v1/push/sub', { endpoint, keys: { p256dh: b.p256dh, auth: b.auth } }, token);
  return { r, b };
};
const subs = async (player: string) =>
  (await env.DB.prepare('SELECT endpoint FROM push_subs WHERE player = ? ORDER BY endpoint').bind(player).all<{ endpoint: string }>())
    .results.map((r) => r.endpoint);

/** Stubs fetch for push services; the requests it got. */
function pushService(status = 201) {
  const got: { url: string; init: RequestInit }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    got.push({ url: String(url), init: init! });
    return new Response(null, { status });
  });
  return got;
}
const until = async (ok: () => boolean) => {
  for (let i = 0; i < 100 && !ok(); i++) await new Promise((r) => setTimeout(r, 10));
};

describe('webpush', () => {
  it('encrypts so the browser can read it', async () => {
    const b = await browser();
    const body = await encrypt({ endpoint: FCM, p256dh: b.p256dh, auth: b.auth }, enc.encode('{"title":"HI"}'));
    expect(body[16]! * 2 ** 24 + body[17]! * 2 ** 16 + body[18]! * 256 + body[19]!).toBe(4096);
    expect(await decrypt(b, body)).toBe('{"title":"HI"}');
  });

  it('signs a VAPID token the push service can check', async () => {
    const h = await vapidAuth(FCM, { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: 'https://x.test/' }, 1_000_000_000);
    const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(h)!;
    expect(m[4]).toBe(env.VAPID_PUBLIC_KEY);
    expect(JSON.parse(new TextDecoder().decode(fromB64url(m[2]!)))).toEqual({ aud: 'https://fcm.googleapis.com', exp: 1_000_000 + 43200, sub: 'https://x.test/' });
    const key = await crypto.subtle.importKey('raw', fromB64url(env.VAPID_PUBLIC_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, fromB64url(m[3]!), enc.encode(`${m[1]}.${m[2]}`))).toBe(true);
  });
});

describe('notes', () => {
  it('are written by the server', () => {
    expect(noteFor({ t: 'gift', name: 'MIA', n: 50 })).toMatchObject({ title: '★50 FROM MIA!' });
    expect(noteFor({ t: 'inv', name: 'MIA', g: 'racer', code: 'ABCD' })).toMatchObject({ body: 'PIXEL GP - TAP TO JOIN (CODE ABCD)', url: 'racer.html?join=ABCD' });
    expect(noteFor({ t: 'inv', name: 'MIA', g: 'nope', code: 'ABCD' })).toBeNull();
    expect(noteFor({ t: 'gift', name: 'MIA' })).toBeNull();
    expect(noteFor({ t: 'chat', name: 'MIA', fid: '222222' })).toMatchObject({ title: 'NEW MESSAGE FROM MIA', tag: 'chat-222222' });
    expect(noteFor({ t: 'gchat', name: 'MIA', gn: 'GANG', gid: 'abcdefgh1234' })).toMatchObject({ title: 'NEW MESSAGE IN GANG', body: 'FROM MIA. TAP TO READ IT IN THE ARCADE.', tag: 'gchat-abcdefgh1234' });
    expect(noteFor({ t: 'gadd', name: 'MIA', gn: 'GANG', gid: 'abcdefgh1234' })).toMatchObject({ title: 'MIA ADDED YOU TO GANG', tag: 'gchat-abcdefgh1234' });
    expect(noteFor({ t: 'gchat', name: 'MIA' })).toBeNull();
    expect(noteFor({ t: 'call', name: 'TOM', fid: '222222' })).toEqual({ title: 'TOM IS CALLING YOU!', body: 'OPEN THE ARCADE TO ANSWER.', url: 'index.html', tag: 'call-222222', call: true });
  });
});

describe('push routes', () => {
  it('gives the public key', async () => {
    expect(await (await call('GET', '/v1/push/key')).json()).toEqual({ key: env.VAPID_PUBLIC_KEY });
  });

  it('keeps a subscription for a logged-in player only, on a real push service', async () => {
    const b = await browser();
    expect((await call('POST', '/v1/push/sub', { endpoint: FCM, keys: { p256dh: b.p256dh, auth: b.auth } })).status).toBe(401);
    const tok = await register();
    expect((await subscribe(tok, 'https://evil.test/x')).r.status).toBe(400);
    expect((await subscribe(tok, 'http://fcm.googleapis.com/x')).r.status).toBe(400);
    expect((await subscribe(tok)).r.status).toBe(204);
    expect((await subscribe(tok, 'https://web.push.apple.com/abc')).r.status).toBe(204);
    expect(await subs('123456')).toEqual([FCM, 'https://web.push.apple.com/abc']);
  });

  it('moves a phone to the account logged in on it, keeps 5 per player, forgets on DELETE', async () => {
    const mia = await register();
    const tom = await register({ id: '222222', name: 'TOM' });
    await subscribe(mia);
    await subscribe(tom);
    expect(await subs('123456')).toEqual([]);
    expect(await subs('222222')).toEqual([FCM]);
    for (let i = 0; i < 7; i++) await subscribe(tom, `${FCM}${i}`);
    expect((await subs('222222')).length).toBe(5);
    await call('DELETE', '/v1/push/sub', { endpoint: `${FCM}6` });
    expect(await subs('222222')).not.toContain(`${FCM}6`);
  });

  it('sends a note to every phone of a friend, never to yourself', async () => {
    const tok = await register();
    const { b } = await subscribe(tok);
    const got = pushService();
    expect((await call('POST', '/v1/push/send', { to: '123456', t: 'gift', from: 'tom!', fid: '222222', n: 100 })).status).toBe(204);
    await until(() => got.length > 0);
    expect(got).toHaveLength(1);
    expect(got[0]!.url).toBe(FCM);
    const h = got[0]!.init.headers as Record<string, string>;
    expect(h['content-encoding']).toBe('aes128gcm');
    expect(h.authorization).toMatch(/^vapid t=.+, k=/);
    const note = JSON.parse(await decrypt(b, new Uint8Array(got[0]!.init.body as Uint8Array)));
    expect(note).toEqual({ title: '★100 FROM TOM!', body: 'OPEN THE ARCADE TO TAKE YOUR STARS.', url: 'index.html', tag: 'gift' });

    got.length = 0;
    await call('POST', '/v1/push/send', { to: '123456', t: 'chat', from: 'MIA', fid: '123456' });
    await call('POST', '/v1/push/send', { to: '123456', t: 'chat', from: 'X' }, tok); // the session says it's MIA herself
    await new Promise((r) => setTimeout(r, 50));
    expect(got).toHaveLength(0);
  });

  it('uses the sender account name, and hides a rude one', async () => {
    const tok = await register();
    const tom = await register({ id: '222222', name: 'TOM' });
    const { b } = await subscribe(tok);
    const got = pushService();
    await call('POST', '/v1/push/send', { to: '123456', t: 'freq', from: 'FAKE', fid: '333333' }, tom);
    await call('POST', '/v1/push/send', { to: '123456', t: 'fyes', from: 'KURVA' });
    await until(() => got.length === 2);
    const titles = await Promise.all(got.map(async (g) => JSON.parse(await decrypt(b, new Uint8Array(g.init.body as Uint8Array))).title));
    expect(titles.sort()).toEqual(['A FRIEND IS YOUR FRIEND NOW!', 'TOM WANTS TO BE YOUR FRIEND']);
  });

  it('tells every member of a group at once, never the sender', async () => {
    const mia = await register();
    const tom = await register({ id: '222222', name: 'TOM' });
    const { b } = await subscribe(mia);
    await subscribe(tom, FCM + '-tom'); // (a phone of its own: the same endpoint would move MIA's subscription to TOM)
    const got = pushService();
    const r = await call('POST', '/v1/push/send', { to: ['123456', '222222', '333333'], t: 'gchat', gn: 'the gang!', gid: 'abcdefgh1234' }, tom);
    expect(r.status).toBe(204);
    await until(() => got.length > 0);
    await new Promise((res) => setTimeout(res, 50));
    expect(got).toHaveLength(1); // MIA's phone: TOM sent it, and 333333 has no phone
    expect(got[0]!.url).toBe(FCM);
    const note = JSON.parse(await decrypt(b, new Uint8Array(got[0]!.init.body as Uint8Array)));
    expect(note).toEqual({ title: 'NEW MESSAGE IN THE GANG', body: 'FROM TOM. TAP TO READ IT IN THE ARCADE.', url: 'index.html', tag: 'gchat-abcdefgh1234' });
  });

  it('hides a rude group name', async () => {
    const mia = await register();
    const { b } = await subscribe(mia);
    const got = pushService();
    await call('POST', '/v1/push/send', { to: ['123456'], t: 'gadd', from: 'TOM', fid: '222222', gn: 'KURVA', gid: 'abcdefgh1234' });
    await until(() => got.length > 0);
    expect(JSON.parse(await decrypt(b, new Uint8Array(got[0]!.init.body as Uint8Array))).title).toBe('TOM ADDED YOU TO A GROUP');
  });

  it('refuses bad messages', async () => {
    for (const body of [{ to: '12345', t: 'gift', n: 5 }, { to: '123456', t: 'hello' }, { to: '123456', t: 'gift' }, { to: '123456', t: 'inv', g: 'racer' },
      { to: ['123456', '222222'], t: 'chat' }, { to: [], t: 'gchat', gn: 'X', gid: 'abcdefgh1234' }, { to: Array(9).fill('123456'), t: 'gchat', gn: 'X', gid: 'abcdefgh1234' },
      { to: ['123456'], t: 'gchat', gn: 'X', gid: 'BAD' }]) {
      expect((await call('POST', '/v1/push/send', body)).status).toBe(400);
    }
  });

  it('forgets a subscription the push service says is gone', async () => {
    const tok = await register();
    await subscribe(tok);
    pushService(410);
    const r = await call('POST', '/v1/push/test', undefined, tok);
    expect(await r.json()).toEqual({ phones: 1, sent: 0 });
    expect(await subs('123456')).toEqual([]);
  });

  it('owner test push needs the admin key', async () => {
    const tok = await register();
    await subscribe(tok);
    const got = pushService();
    expect((await call('POST', '/v1/admin/push/123456')).status).toBe(401);
    const r = await call('POST', '/v1/admin/push/123456?key=test-admin');
    expect(await r.json()).toEqual({ phones: 1, statuses: [201] });
    expect(got).toHaveLength(1);
  });

  it('deleting a player removes their subscriptions', async () => {
    const tok = await register();
    await subscribe(tok);
    await call('DELETE', '/v1/me', undefined, tok);
    expect(await subs('123456')).toEqual([]);
  });
});
