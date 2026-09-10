import type { Request, Response } from 'express';
import { asyncHandler, sendOk } from '@hospital/common';
import { departmentService } from '../services/department.service.js';

export const departmentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { keyword } = req.query as { keyword?: string };
    sendOk(res, await departmentService.list(keyword));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    sendOk(res, await departmentService.getById(req.params.departmentId));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentService.create(req.body);
    sendOk(res, department, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    sendOk(res, await departmentService.update(req.params.departmentId, req.body));
  })
};
