import { z } from 'zod';

const uuidMessage = '必须是 UUID 格式';

export const createDepartmentSchema = z.object({
  code: z.string().min(2, '科室编码至少 2 个字符').max(30).regex(/^[A-Za-z0-9_-]+$/, '科室编码只能包含字母、数字、_ -'),
  name: z.string().min(1, '科室名称不能为空').max(100),
  description: z.string().max(2000).nullable().optional().default(null),
  location: z.string().max(200).nullable().optional().default(null),
  contactPhone: z
    .string()
    .regex(/^[0-9+\-\s()]{5,30}$/, '联系电话格式不正确')
    .nullable()
    .optional()
    .default(null),
  headDoctorId: z.string().uuid(uuidMessage).nullable().optional().default(null)
});

export const updateDepartmentSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    contactPhone: z.string().regex(/^[0-9+\-\s()]{5,30}$/, '联系电话格式不正确').nullable().optional(),
    headDoctorId: z.string().uuid(uuidMessage).nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: '至少提供一个待更新字段' });

export const listDepartmentsQuerySchema = z.object({
  keyword: z.string().min(1).max(100).optional()
});

export const listSchedulesQuerySchema = z.object({
  dateFrom: z.string().date('日期格式必须为 YYYY-MM-DD').optional(),
  dateTo: z.string().date('日期格式必须为 YYYY-MM-DD').optional()
});

export const createScheduleSchema = z.object({
  staffId: z.string().uuid(uuidMessage),
  staffName: z.string().min(1, '值班人员姓名不能为空').max(100),
  dutyDate: z.string().date('值班日期格式必须为 YYYY-MM-DD'),
  shift: z.enum(['MORNING', 'AFTERNOON', 'NIGHT']),
  note: z.string().max(1000).nullable().optional().default(null)
});

export const updateScheduleSchema = z
  .object({
    staffId: z.string().uuid(uuidMessage).optional(),
    staffName: z.string().min(1).max(100).optional(),
    dutyDate: z.string().date('值班日期格式必须为 YYYY-MM-DD').optional(),
    shift: z.enum(['MORNING', 'AFTERNOON', 'NIGHT']).optional(),
    note: z.string().max(1000).nullable().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: '至少提供一个待更新字段' });
