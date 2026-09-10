import { Router } from 'express';
import { authenticate, requirePermission } from '@hospital/common';
import { env } from '../env.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { restrictToOwnDepartment } from '../middleware/scope.js';
import {
  createDepartmentSchema,
  createScheduleSchema,
  listDepartmentsQuerySchema,
  listSchedulesQuerySchema,
  updateDepartmentSchema,
  updateScheduleSchema
} from '../validation/schemas.js';
import { departmentController } from '../controllers/department.controller.js';
import { scheduleController } from '../controllers/schedule.controller.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'department-service' });
});

const auth = authenticate(env.jwtSecret);

// ---- 科室资料 ----
router.get(
  '/departments',
  auth,
  requirePermission('department:read'),
  validateQuery(listDepartmentsQuerySchema),
  departmentController.list
);
router.post(
  '/departments',
  auth,
  requirePermission('department:manage'),
  validateBody(createDepartmentSchema),
  departmentController.create
);
router.get(
  '/departments/:departmentId',
  auth,
  requirePermission('department:read'),
  restrictToOwnDepartment(),
  departmentController.getById
);
router.patch(
  '/departments/:departmentId',
  auth,
  requirePermission('department:manage'),
  validateBody(updateDepartmentSchema),
  departmentController.update
);

// ---- 值班信息（嵌套于科室下）----
router.get(
  '/departments/:departmentId/schedules',
  auth,
  requirePermission('schedule:read'),
  restrictToOwnDepartment(),
  validateQuery(listSchedulesQuerySchema),
  scheduleController.list
);
router.post(
  '/departments/:departmentId/schedules',
  auth,
  requirePermission('schedule:manage'),
  restrictToOwnDepartment(),
  validateBody(createScheduleSchema),
  scheduleController.create
);
router.patch(
  '/departments/:departmentId/schedules/:scheduleId',
  auth,
  requirePermission('schedule:manage'),
  validateBody(updateScheduleSchema),
  scheduleController.update
);
router.delete(
  '/departments/:departmentId/schedules/:scheduleId',
  auth,
  requirePermission('schedule:manage'),
  scheduleController.remove
);
