/**
 * 统一数据库迁移规范（docs/standards/database.md）：
 * - 迁移文件：migrations/V{序号}__{描述}.{up,down}.sql
 * - 每个迁移在事务中执行，并在 schema_migrations 记录版本
 * - 只允许通过迁移变更表结构，禁止在业务代码中执行 DDL
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Pool } from 'pg';

const MIGRATION_NAME = /^V(\d+)__([a-z0-9_]+)\.(up|down)\.sql$/;

interface MigrationFile {
  version: number;
  name: string;
  upPath: string;
  downPath: string;
}

function loadMigrations(migrationsDir: string): MigrationFile[] {
  const entries = readdirSync(migrationsDir);
  const grouped = new Map<number, MigrationFile>();

  for (const entry of entries) {
    const match = entry.match(MIGRATION_NAME);
    if (!match) continue;
    const version = Number(match[1]);
    const name = match[2];
    const kind = match[3] as 'up' | 'down';
    const current = grouped.get(version) ?? { version, name, upPath: '', downPath: '' };
    current[`${kind}Path`] = path.join(migrationsDir, entry);
    grouped.set(version, current);
  }

  for (const migration of grouped.values()) {
    if (!migration.upPath || !migration.downPath) {
      throw new Error(`迁移 V${migration.version}__${migration.name} 缺少 up 或 down 文件`);
    }
  }

  return [...grouped.values()].sort((a, b) => a.version - b.version);
}

export interface MigrationLogger {
  info: (msg: string) => void;
  warn?: (msg: string) => void;
}

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function runMigrations(
  pool: Pool,
  migrationsDir: string,
  logger: MigrationLogger = { info: console.log }
): Promise<void> {
  await ensureMigrationsTable(pool);
  const migrations = loadMigrations(migrationsDir);
  const { rows } = await pool.query<{ version: number }>('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r) => Number(r.version)));

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    const sql = readFileSync(migration.upPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
        migration.version,
        migration.name
      ]);
      await client.query('COMMIT');
      logger.info(`已应用迁移 V${migration.version}__${migration.name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`迁移 V${migration.version}__${migration.name} 执行失败: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
  logger.info(`迁移检查完成，共 ${migrations.length} 个版本`);
}

export async function rollbackLastMigration(
  pool: Pool,
  migrationsDir: string,
  logger: MigrationLogger = { info: console.log }
): Promise<void> {
  await ensureMigrationsTable(pool);
  const { rows } = await pool.query<{ version: number; name: string }>(
    'SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1'
  );
  if (rows.length === 0) {
    logger.info('没有可回滚的迁移');
    return;
  }
  const last = rows[0];
  const migration = loadMigrations(migrationsDir).find((m) => m.version === last.version);
  if (!migration) throw new Error(`找不到版本 V${last.version} 对应的迁移文件`);

  const sql = readFileSync(migration.downPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE version = $1', [last.version]);
    await client.query('COMMIT');
    logger.info(`已回滚迁移 V${last.version}__${last.name}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`回滚 V${last.version} 失败: ${(err as Error).message}`);
  } finally {
    client.release();
  }
}
