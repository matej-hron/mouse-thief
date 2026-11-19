import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// readD1Migrations resolves the path relative to process.cwd() (project root)
export default defineConfig(async () => {
  const migrations = await readD1Migrations('migrations');
  return {
    test: {
      globals: true,
      setupFiles: ['./test/apply-migrations.ts'],
    },
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        // no remote bindings: the Workers AI binding (talking characters) is a stand-in in the tests (test/npc.test.ts)
        remoteBindings: false,
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            ADMIN_KEY: 'test-admin',
            // a key pair only for the tests (the real private key is a secret on Cloudflare)
            VAPID_PUBLIC_KEY: 'BMabOob5ZRW9FJuggNzQxS_DFBxi-Q0CAjeN0PY-WZZuZSLBlT-SISo5VsLi7P53koBB0A7PoYX1BMhCUCf4RZY',
            VAPID_PRIVATE_KEY: 'JMwMLnvjRAbReAV7cKrbCqgj67cIHBhiM1dyAi_tezc',
          },
          // the real limit (5/min) would throttle the many registers in the tests; the limit itself is tested with a stub
          ratelimits: {
            REGISTER_LIMIT: { namespace_id: '1001', simple: { limit: 100000, period: 60 } },
            PUSH_LIMIT: { namespace_id: '1002', simple: { limit: 100000, period: 60 } },
          },
        },
      }),
    ],
  };
});
