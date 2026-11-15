import { SELF, env } from 'cloudflare:test';

export const H = (c: string) => c.repeat(64);
export const PW = H('a');
export const RPW = H('b');

export const call = (method: string, path: string, body?: unknown, token?: string) =>
  SELF.fetch(`https://api.test${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const reg = (over: Record<string, unknown> = {}) =>
  call('POST', '/v1/register', {
    id: '123456', name: 'MIA', avatar: { shape: 'cat', color: 3 },
    csalt: H('1'), pw: PW, rsalt: H('2'), rpw: RPW, ...over,
  });

export const register = async (over: Record<string, unknown> = {}) => ((await (await reg(over)).json()) as { token: string }).token;
export const login = (name = 'MIA', pw = PW) => call('POST', '/v1/login', { name, pw });
export const code = async (r: Response) => ((await r.json()) as { error: string }).error;

export const resetTables = () =>
  env.DB.batch(['players', 'sessions', 'scores', 'saves', 'login_fail'].map((t) => env.DB.prepare(`DELETE FROM ${t}`)));
