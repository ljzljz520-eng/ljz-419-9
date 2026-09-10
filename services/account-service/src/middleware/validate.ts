import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/** 统一校验中间件：直接抛出 ZodError，由 common 错误中间件转换为标准错误响应 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      next();
    } else {
      next(result.error);
    }
  };
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (result.success) {
      req.query = result.data as typeof req.query;
      next();
    } else {
      next(result.error);
    }
  };
}
