import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createLogger, createPool } from '@hospital/common';

dotenv.config();

const logger = createLogger({ service: 'account-service-seed' });
const pool = createPool(process.env.DATABASE_URL ?? '');

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
  const passwordHash = await bcrypt.hash('Password123', 10);
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, username, password_hash, full_name, role, department_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO NOTHING`,
      [u.id, u.username, passwordHash, u.fullName, u.role, u.departmentId]
    );
    logger.info(`已确保种子用户存在：${u.username} / Password123（${u.role}）`);
  }
}

main()
  .catch((err) => {
    logger.error({ err }, '种子数据写入失败');
    process.exitCode = 1;
  })
  .finally(() => void pool.end());
