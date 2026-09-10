import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '@hospital/common';

/**
 * 科室数据范围限制：
 * - ADMIN（departmentId 为 null）可访问任意科室
 * - DOCTOR / NURSE 只能访问 :departmentId 与自己所属科室一致的资源
 */
export function restrictToOwnDepartment(paramName = 'departmentId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user!;
    const targetId = req.params[paramName];
    if (user.departmentId !== null && user.departmentId !== targetId) {
      throw new ForbiddenError('只能访问本科室的数据');
    }
    next();
  };
}
