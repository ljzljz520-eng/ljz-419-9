import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger, createPool, rollbackLastMigration, runMigrations } from '@hospital/common';

dotenv.config();

const service = 'department-service';
const logger = createLogger({ service: `${service}-migrate` });
const pool = createPool(process.env.DATABASE_URL ?? '');
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const rollback = process.argv.includes('--rollback');

async function main(): Promise<void> {
  if (rollback) {
    await rollbackLastMigration(pool, migrationsDir, { info: (m) => logger.info(m) });
  } else {
    await runMigrations(pool, migrationsDir, { info: (m) => logger.info(m) });
  }
}

main()
  .catch((err) => {
    logger.error({ err }, '迁移失败');
    process.exitCode = 1;
  })
  .finally(() => void pool.end());
