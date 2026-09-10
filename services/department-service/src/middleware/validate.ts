import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

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
