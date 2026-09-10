import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from './errors.js';
import { asyncHandler } from './http.js';

export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE';

export type Permission =
  | 'user:read'
  | 'user:manage'
  | 'department:read'
  | 'department:manage'
  | 'schedule:read'
  | 'schedule:manage'
  | 'schedule:read:department';

export interface AuthUser {
  sub: string;
  username: string;
  role: Role;
  departmentId: string | null;
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ['user:read', 'user:manage', 'department:read', 'department:manage', 'schedule:read', 'schedule:manage'],
  DOCTOR: ['department:read', 'schedule:read', 'schedule:read:department'],
  NURSE: ['department:read', 'schedule:read', 'schedule:read:department']
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export interface SignTokenOptions {
  secret: string;
  expiresIn?: string;
}

export async function signToken(user: AuthUser, options: SignTokenOptions): Promise<string> {
  return jwt.sign(
    { username: user.username, role: user.role, departmentId: user.departmentId },
    options.secret,
    { subject: user.sub, expiresIn: (options.expiresIn ?? '8h') as SignOptions['expiresIn'] }
  );
}

export function verifyToken(token: string, secret: string): AuthUser {
  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!payload.sub || !payload.username || !payload.role) {
      throw new UnauthorizedError('令牌内容不完整');
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role as Role,
      departmentId: (payload.departmentId as string | null) ?? null
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('令牌已过期，请重新登录');
    }
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('令牌无效');
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

/** 认证中间件：解析并校验 Bearer JWT，注入 req.user */
export function authenticate(secret: string) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) throw new UnauthorizedError('缺少 Authorization Bearer 令牌');
    req.user = verifyToken(token, secret);
    req.log = req.log.child({ userId: req.user.sub, role: req.user.role });
    next();
  });
}

/** 角色限制中间件 */
export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`该操作仅允许以下角色：${roles.join(', ')}`);
    }
    next();
  };
}

/** 细粒度权限限制中间件 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roleHasPermission(req.user.role, permission)) {
      throw new ForbiddenError(`缺少权限：${permission}`);
    }
    next();
  };
}
