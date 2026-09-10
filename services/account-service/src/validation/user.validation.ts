import { z } from 'zod';

const uuidMessage = '必须是 UUID 格式';

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50),
  password: z.string().min(1, '密码不能为空').max(200)
});

export const createUserSchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符').max(50).regex(/^[a-zA-Z0-9_.-]+$/, '用户名只能包含字母、数字、_ . -'),
  password: z.string().min(8, '密码至少 8 个字符').max(200),
  fullName: z.string().min(1, '姓名不能为空').max(100),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE']),
  departmentId: z.string().uuid(uuidMessage).nullable().default(null)
});

export const updateUserSchema = z
  .object({
    password: z.string().min(8, '密码至少 8 个字符').max(200).optional(),
    fullName: z.string().min(1).max(100).optional(),
    role: z.enum(['ADMIN', 'DOCTOR', 'NURSE']).optional(),
    departmentId: z.string().uuid(uuidMessage).nullable().optional(),
    status: z.enum(['ACTIVE', 'DISABLED']).optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: '至少提供一个待更新字段' });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE']).optional(),
  departmentId: z.string().uuid(uuidMessage).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional()
});
