import { describe, expect, it } from 'vitest';
import { call } from './helpers';
import { usable } from '../src/turn';

describe('TURN', () => {
  it('answers an empty list without the TURN secrets (the arcade then uses its free relays)', async () => {
    const r = await call('GET', '/v1/turn');
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await r.json()).toEqual({ iceServers: [] });
  });

  it('leaves out port 53, which browsers refuse', () => {
    expect(usable([
      { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
      { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turn:turn.cloudflare.com:53?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'], username: 'u', credential: 'c' },
      { urls: 'turn:turn.cloudflare.com:53' },
    ])).toEqual([
      { urls: ['stun:stun.cloudflare.com:3478'] },
      { urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'], username: 'u', credential: 'c' },
    ]);
  });
});
