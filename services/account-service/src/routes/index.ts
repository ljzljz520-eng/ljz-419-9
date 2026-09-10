import { Router } from 'express';
import { authenticate, requirePermission, requireRoles } from '@hospital/common';
import { env } from '../env.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  loginSchema,
  updateUserSchema
} from '../validation/user.validation.js';
import { authController } from '../controllers/auth.controller.js';
import { userController } from '../controllers/user.controller.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'account-service' });
});

// ---- 认证 ----
router.post('/auth/login', validateBody(loginSchema), authController.login);
router.get('/auth/me', authenticate(env.jwtSecret), authController.me);

// ---- 用户管理 ----
const auth = authenticate(env.jwtSecret);
router.get('/users', auth, requirePermission('user:read'), validateQuery(listUsersQuerySchema), userController.list);
router.post('/users', auth, requireRoles('ADMIN'), validateBody(createUserSchema), userController.create);
router.get('/users/:id', auth, requirePermission('user:read'), userController.getById);
router.patch('/users/:id', auth, requireRoles('ADMIN'), validateBody(updateUserSchema), userController.update);
router.delete('/users/:id', auth, requireRoles('ADMIN'), userController.remove);
