import type { Request, Response } from 'express';
import { asyncHandler, sendOk } from '@hospital/common';
import { scheduleService } from '../services/schedule.service.js';

export const scheduleController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };
    sendOk(
      res,
      await scheduleService.list({ departmentId: req.params.departmentId, dateFrom, dateTo })
    );
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const schedule = await scheduleService.create({
      departmentId: req.params.departmentId,
      ...req.body
    });
    sendOk(res, schedule, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.departmentId !== null) {
      await scheduleService.assertDepartmentScope(req.user!.departmentId, req.params.scheduleId);
    }
    sendOk(res, await scheduleService.update(req.params.scheduleId, req.body));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.departmentId !== null) {
      await scheduleService.assertDepartmentScope(req.user!.departmentId, req.params.scheduleId);
    }
    await scheduleService.remove(req.params.scheduleId);
    sendOk(res, { id: req.params.scheduleId, deleted: true });
  })
};
