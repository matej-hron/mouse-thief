// Web Push from a Worker, with nothing but WebCrypto: the message is encrypted for the browser (RFC 8291, aes128gcm)
// and the request is signed with the arcade's VAPID key (RFC 8292), so the browser's push service (Google, Mozilla,
// Apple...) delivers it to the phone, which shows it from the service worker (sw.js).

export type Subscription = { endpoint: string; p256dh: string; auth: string };
export type Vapid = { publicKey: string; privateKey: string; subject: string };

const enc = new TextEncoder();

export const b64url = (bytes: Uint8Array): string => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const fromB64url = (s: string): Uint8Array => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
};

const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

/** HKDF-SHA-256 (extract and expand in one), `length` bytes. */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

// ECDH with the other side's public key (the spec's `public`; the Workers types call it `$public`)
const ecdh = (pub: CryptoKey) => ({ name: 'ECDH', public: pub }) as unknown as SubtleCryptoDeriveKeyAlgorithm;

/** Encrypts `payload` for one subscription (RFC 8291): one aes128gcm record with its header. */
export async function encrypt(sub: Subscription, payload: Uint8Array): Promise<Uint8Array> {
  const uaPublic = fromB64url(sub.p256dh);
  const authSecret = fromB64url(sub.auth);
  const ua = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const as = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  const asPublic = new Uint8Array((await crypto.subtle.exportKey('raw', as.publicKey)) as ArrayBuffer);
  const shared = new Uint8Array(await crypto.subtle.deriveBits(ecdh(ua), as.privateKey, 256));

  const ikm = await hkdf(authSecret, shared, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(payload, new Uint8Array([2]))), // 2: the last record
  );
  const rs = new Uint8Array([0, 0, 0x10, 0]); // record size 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, sealed);
}

/** The VAPID Authorization header for a push service (a JWT signed with the arcade's key, good for 12 hours). */
export async function vapidAuth(endpoint: string, vapid: Vapid, now = Date.now()): Promise<string> {
  const pub = fromB64url(vapid.publicKey);
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: vapid.privateKey, x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33, 65)) },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const json = (o: object) => b64url(enc.encode(JSON.stringify(o)));
  const unsigned = `${json({ typ: 'JWT', alg: 'ES256' })}.${json({
    aud: new URL(endpoint).origin,
    exp: Math.floor(now / 1000) + 12 * 3600,
    sub: vapid.subject,
  })}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned)));
  return `vapid t=${unsigned}.${b64url(sig)}, k=${vapid.publicKey}`;
}

/**
 * Sends one push. Returns the push service's HTTP status (201 = accepted; 404 / 410 = the subscription is gone and
 * should be forgotten), or 0 when it couldn't be reached.
 */
export async function sendPush(sub: Subscription, message: object, vapid: Vapid, ttl = 12 * 3600): Promise<number> {
  try {
    const body = await encrypt(sub, enc.encode(JSON.stringify(message)));
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        authorization: await vapidAuth(sub.endpoint, vapid),
        'content-encoding': 'aes128gcm',
        'content-type': 'application/octet-stream',
        ttl: String(ttl),
        urgency: 'high',
      },
      body,
    });
    return res.status;
  } catch {
    return 0;
  }
}
