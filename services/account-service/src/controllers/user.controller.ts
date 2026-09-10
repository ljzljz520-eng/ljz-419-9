import type { Request, Response } from 'express';
import { asyncHandler, sendOk, sendPage } from '@hospital/common';
import { userService } from '../services/user.service.js';

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, role, departmentId, status } = req.query as unknown as {
      page: number;
      pageSize: number;
      role?: 'ADMIN' | 'DOCTOR' | 'NURSE';
      departmentId?: string;
      status?: 'ACTIVE' | 'DISABLED';
    };
    const result = await userService.list({ page, pageSize, role, departmentId, status });
    sendPage(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id);
    sendOk(res, user);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as {
      username: string;
      password: string;
      fullName: string;
      role: 'ADMIN' | 'DOCTOR' | 'NURSE';
      departmentId: string | null;
    };
    const user = await userService.create(input);
    sendOk(res, user, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id, req.body);
    sendOk(res, user);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.remove(req.params.id);
    sendOk(res, { id: req.params.id, deleted: true });
  })
};
