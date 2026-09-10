import type { Request, Response } from 'express';
import { asyncHandler, sendOk } from '@hospital/common';
import { login } from '../services/auth.service.js';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as { username: string; password: string };
    const result = await login(username, password);
    sendOk(res, result);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    // req.user 来自 authenticate 中间件；用户详情通过服务查询，保证状态变更即时生效
    const result = await import('../services/user.service.js').then((m) =>
      m.userService.getById(req.user!.sub)
    );
    sendOk(res, result);
  })
};
