import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger, createPool, loadEnv, resolveDatabaseUrl } from '@hospital/common';

loadEnv(path.dirname(fileURLToPath(import.meta.url)));

const logger = createLogger({ service: 'account-service-seed' });

const DEPT_INTERNAL = '00000000-0000-4000-8000-000000000001';
const DOCTOR_ID = '00000000-0000-4000-8000-000000000101';
const NURSE_ID = '00000000-0000-4000-8000-000000000102';
const ADMIN_ID = '00000000-0000-4000-8000-000000000100';

const users = [
  { id: ADMIN_ID, username: 'admin', fullName: '系统管理员', role: 'ADMIN', departmentId: null },
  { id: DOCTOR_ID, username: 'doctor1', fullName: '李医生', role: 'DOCTOR', departmentId: DEPT_INTERNAL },
  { id: NURSE_ID, username: 'nurse1', fullName: '王护士', role: 'NURSE', departmentId: DEPT_INTERNAL }
];

async function main(): Promise<void> {
  // 支持 DATABASE_URL（服务级 .env）或 ACCOUNT_DATABASE_URL（根 .env 统一注入）
  const pool = createPool(resolveDatabaseUrl('ACCOUNT_DATABASE_URL'));
  try {
    const passwordHash = await bcrypt.hash('Password123', 10);
    for (const u of users) {
      await pool.query(
        `INSERT INTO users (id, username, password_hash, full_name, role, department_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO NOTHING`,
        [u.id, u.username, passwordHash, u.fullName, u.role, u.departmentId]
      );
      // 日志规范（docs/standards/logging.md §3）禁止打印密码/密码哈希，
      // 种子账号的初始密码仅记录在 README 与数据库规范文档中。
      logger.info(`已确保种子用户存在：${u.username}（${u.role}）`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  logger.error({ err }, '种子数据写入失败');
  process.exitCode = 1;
});
