/**
 * 统一错误响应规范（docs/standards/api-errors.md）。
 * 所有失败响应结构：
 * {
 *   "success": false,
 *   "error": {
 *     "code": "MACHINE_READABLE_CODE",
 *     "message": "面向调用方的可读信息",
 *     "details": [ ... ]   // 可选，字段级错误
 *   },
 *   "requestId": "..."
 * }
 */

export type ErrorDetail = { field?: string; message: string };

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: ErrorDetail[];

  constructor(code: string, message: string, statusCode = 400, details?: ErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_UUID: 'INVALID_UUID',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export class ValidationError extends AppError {
  constructor(message = '请求参数校验失败', details?: ErrorDetail[]) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未认证或认证已失效') {
    super(ErrorCodes.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '没有执行该操作的权限') {
    super(ErrorCodes.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(ErrorCodes.NOT_FOUND, `${resource}不存在`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCodes.CONFLICT, message, 409);
  }
}

export class InvalidUuidError extends AppError {
  constructor(field = 'id') {
    super(ErrorCodes.INVALID_UUID, `${field} 不是合法的 UUID`, 400, [{ field, message: '必须是 UUID 格式' }]);
  }
}

/** 将 pg 的 unique_violation (23505) 转换为 CONFLICT */
export function isPgUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}
