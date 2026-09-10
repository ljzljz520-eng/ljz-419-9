import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger, createPool, loadEnv, resolveDatabaseUrl } from '@hospital/common';

loadEnv(path.dirname(fileURLToPath(import.meta.url)));

const logger = createLogger({ service: 'department-service-seed' });

const DEPT_INTERNAL = '00000000-0000-4000-8000-000000000001';
const DEPT_SURGERY = '00000000-0000-4000-8000-000000000002';
const DOCTOR_ID = '00000000-0000-4000-8000-000000000101';

const departments = [
  {
    id: DEPT_INTERNAL,
    code: 'INTERNAL',
    name: '内科',
    description: '负责常见内科疾病的门诊与住院诊疗',
    location: '门诊楼 3 层',
    contactPhone: '010-88880001',
    headDoctorId: DOCTOR_ID
  },
  {
    id: DEPT_SURGERY,
    code: 'SURGERY',
    name: '外科',
    description: '负责外科手术及术后康复',
    location: '住院楼 5 层',
    contactPhone: '010-88880002',
    headDoctorId: null
  }
];

const schedules = [
  {
    departmentId: DEPT_INTERNAL,
    staffId: DOCTOR_ID,
    staffName: '李医生',
    dutyDate: '2026-09-10',
    shift: 'MORNING',
    note: '内科门诊'
  },
  {
    departmentId: DEPT_INTERNAL,
    staffId: '00000000-0000-4000-8000-000000000102',
    staffName: '王护士',
    dutyDate: '2026-09-10',
    shift: 'NIGHT',
    note: '夜间病房巡视'
  }
];

async function main(): Promise<void> {
  // 支持 DATABASE_URL（服务级 .env）或 DEPARTMENT_DATABASE_URL（根 .env 统一注入）
  const pool = createPool(resolveDatabaseUrl('DEPARTMENT_DATABASE_URL'));
  try {
    for (const d of departments) {
      await pool.query(
        `INSERT INTO departments (id, code, name, description, location, contact_phone, head_doctor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (code) DO NOTHING`,
        [d.id, d.code, d.name, d.description, d.location, d.contactPhone, d.headDoctorId]
      );
      logger.info(`已确保种子科室存在：${d.code} ${d.name}`);
    }
    for (const s of schedules) {
      await pool.query(
        `INSERT INTO duty_schedules (department_id, staff_id, staff_name, duty_date, shift, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [s.departmentId, s.staffId, s.staffName, s.dutyDate, s.shift, s.note]
      );
    }
    logger.info('已确保种子值班数据存在');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  logger.error({ err }, '种子数据写入失败');
  process.exitCode = 1;
});
