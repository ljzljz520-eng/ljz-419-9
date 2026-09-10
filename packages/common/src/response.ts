import type { Response } from 'express';

/**
 * 统一成功响应信封：{ success: true, data, requestId? }
 * 列表分页：{ success: true, data: { items, page, pageSize, total } }
 */
export function sendOk<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function sendPage<T>(res: Response, result: PageResult<T>): void {
  res.json({ success: true, data: result });
}
