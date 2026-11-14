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
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations, ADMIN_KEY: 'test-admin' },
        },
      }),
    ],
  };
});
