import type { NextFunction, Request, Response } from 'express';
import { AppError, ErrorCodes } from './errors.js';
import type { ServiceLogger } from './logger.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** pino-http 注入的请求 ID，错误响应中回显 */
      id?: string;
      log: ServiceLogger;
    }
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(ErrorCodes.NOT_FOUND, `路由 ${req.method} ${req.path} 不存在`, 404));
}

/** 捕获 async 控制器抛出的异常并交给错误中间件 */
export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };
}

/**
 * 统一错误处理中间件。所有服务共用，保证错误响应结构一致。
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id ?? '';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      req.log.error({ err, code: err.code }, err.message);
    } else {
      req.log.warn({ code: err.code, details: err.details }, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
      requestId
    });
    return;
  }

  // Zod 校验错误（不在此处直接 import 类型，用 name 判断避免耦合）
  if (err instanceof Error && err.name === 'ZodError') {
    const zodErr = err as unknown as { issues: Array<{ path: (string | number)[]; message: string }> };
    const details = zodErr.issues.map((i) => ({
      field: i.path.join('.') || undefined,
      message: i.message
    }));
    req.log.warn({ code: ErrorCodes.VALIDATION_ERROR, details }, '请求参数校验失败');
    res.status(400).json({
      success: false,
      error: { code: ErrorCodes.VALIDATION_ERROR, message: '请求参数校验失败', details },
      requestId
    });
    return;
  }

  const message = err instanceof Error ? err.message : '未知错误';
  req.log.error({ err }, '未处理的内部错误');
  res.status(500).json({
    success: false,
    error: { code: ErrorCodes.INTERNAL_ERROR, message: '服务器内部错误' },
    requestId
  });
}

