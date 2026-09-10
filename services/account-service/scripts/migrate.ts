import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createLogger,
  createPool,
  loadEnv,
  resolveDatabaseUrl,
  rollbackLastMigration,
  runMigrations
} from '@hospital/common';

loadEnv(path.dirname(fileURLToPath(import.meta.url)));

const service = 'account-service';
const logger = createLogger({ service: `${service}-migrate` });
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const rollback = process.argv.includes('--rollback');

async function main(): Promise<void> {
  // 支持 DATABASE_URL（服务级 .env）或 ACCOUNT_DATABASE_URL（根 .env 统一注入）
  const pool = createPool(resolveDatabaseUrl('ACCOUNT_DATABASE_URL'));
  try {
    if (rollback) {
      await rollbackLastMigration(pool, migrationsDir, { info: (m) => logger.info(m) });
    } else {
      await runMigrations(pool, migrationsDir, { info: (m) => logger.info(m) });
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  logger.error({ err }, '迁移失败');
  process.exitCode = 1;
});
