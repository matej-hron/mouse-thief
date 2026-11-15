/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { applyD1Migrations, env } from 'cloudflare:test';
import type { D1Migration } from 'cloudflare:test';

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      ADMIN_KEY: string;
      VAPID_PUBLIC_KEY: string;
      VAPID_PRIVATE_KEY: string;
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
