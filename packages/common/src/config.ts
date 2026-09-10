/** 环境变量统一加载与校验 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`缺少必需的环境变量 ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : fallback;
}

/**
 * 加载环境变量文件：从调用文件所在目录向上查找含 package.json 的目录
 * （服务目录、monorepo 根目录），依次加载其中的 .env：
 * 1. monorepo 根目录 .env（如 ACCOUNT_DATABASE_URL / DEPARTMENT_DATABASE_URL，
 *    对应根目录 .env.example，首次部署只需 `cp .env.example .env`）；
 * 2. 服务目录 .env（服务级覆盖配置，对应各服务的 .env.example）。
 *
 * 真实环境变量优先级最高（dotenv 不覆盖已存在的值），服务级 .env 其次，根 .env 最后。
 * 缺失的文件静默跳过。
 */
export function loadEnv(callerFile: string): void {
  const pkgDirs: string[] = [];
  let dir = path.dirname(callerFile);
  let prev = '';
  while (dir !== prev) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      pkgDirs.push(dir);
    }
    prev = dir;
    dir = path.dirname(dir);
  }
  // 从最外层（monorepo 根）向内（服务目录）加载，内层可覆盖外层
  for (const pkgDir of pkgDirs.reverse()) {
    dotenv.config({ path: path.join(pkgDir, '.env') });
  }
}

/**
 * 解析数据库连接串：优先读取通用的 DATABASE_URL（服务级 .env / 显式注入），
 * 其次读取服务专属变量（根 .env 统一注入）。
 *
 * 两者都缺失时立即抛出明确错误，绝不退回 pg 的默认值
 * （postgres://localhost:5432 会报具有误导性的 ECONNREFUSED，
 * 首次部署时容易被误判为 PostgreSQL 未启动）。
 */
export function resolveDatabaseUrl(serviceEnvName: string): string {
  const value = process.env.DATABASE_URL || process.env[serviceEnvName];
  if (!value || value.trim() === '') {
    throw new Error(
      `缺少数据库连接串：请设置 DATABASE_URL（服务级 .env）或 ${serviceEnvName}` +
        '（根目录 .env，可执行 `cp .env.example .env`），或通过环境变量显式注入'
    );
  }
  return value;
}
