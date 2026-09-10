import pg from 'pg';

/**
 * 统一创建 pg 连接池。
 * DATE (OID 1082) 直接解析为 'YYYY-MM-DD' 字符串，避免被按本地时区转成 Date 后跨天；
 * TIMESTAMPTZ 保持默认 Date 行为，由各服务在序列化时输出 ISO8601。
 */
pg.types.setTypeParser(1082, (value: string) => value);

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });
}

export type DbClient = pg.PoolClient;
export type { Pool } from 'pg';
