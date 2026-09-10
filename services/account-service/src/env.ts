import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, optionalEnv, requireEnv, resolveDatabaseUrl } from '@hospital/common';

// 依次加载 monorepo 根 .env 与本服务 .env（后者覆盖前者，真实环境变量优先级最高）
loadEnv(path.dirname(fileURLToPath(import.meta.url)));

export const env = {
  port: Number(optionalEnv('PORT', optionalEnv('ACCOUNT_PORT', '3001'))),
  // 支持 DATABASE_URL（服务级 .env / 显式注入）或 ACCOUNT_DATABASE_URL（根 .env）
  databaseUrl: resolveDatabaseUrl('ACCOUNT_DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '8h'),
  logLevel: optionalEnv('LOG_LEVEL', 'info')
};
