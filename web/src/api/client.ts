import axios, { AxiosError } from 'axios';
import type { PageData } from '../types';

/** 统一错误结构，与后端规范（docs/standards/api-errors.md）保持一致 */
export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  details?: ApiErrorDetail[];
  requestId?: string;

  constructor(code: string, message: string, details?: ApiErrorDetail[], requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

interface ErrorBody {
  success: false;
  error: { code: string; message: string; details?: ApiErrorDetail[] };
  requestId?: string;
}

const TOKEN_KEY = 'hospital.accessToken';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function createAxios(baseURL: string) {
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ErrorBody>) => {
      if (error.response?.data?.error) {
        const body = error.response.data;
        return Promise.reject(
          new ApiError(body.error.code, body.error.message, body.error.details, body.requestId)
        );
      }
      return Promise.reject(new ApiError('NETWORK_ERROR', error.message || '网络异常，请稍后重试'));
    }
  );

  return instance;
}

export const accountApi = createAxios('/api/account');
export const departmentApi = createAxios('/api/department');

/** 解包统一成功响应信封 { success, data } */
async function unwrap<T>(promise: Promise<{ data: { success: true; data: T } }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export const authApi = {
  login: (username: string, password: string) =>
    unwrap<{ accessToken: string; tokenType: string; user: import('../types').AuthUser }>(
      accountApi.post('/auth/login', { username, password })
    ),
  me: () => unwrap<import('../types').AuthUser>(accountApi.get('/auth/me'))
};

export const usersApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    role?: string;
    departmentId?: string;
    status?: string;
  }) => unwrap<PageData<import('../types').AuthUser>>(accountApi.get('/users', { params })),
  create: (payload: Record<string, unknown>) =>
    unwrap<import('../types').AuthUser>(accountApi.post('/users', payload)),
  update: (id: string, payload: Record<string, unknown>) =>
    unwrap<import('../types').AuthUser>(accountApi.patch(`/users/${id}`, payload)),
  remove: (id: string) =>
    unwrap<{ id: string; deleted: boolean }>(accountApi.delete(`/users/${id}`))
};

export const departmentsApi = {
  list: (keyword?: string) =>
    unwrap<import('../types').Department[]>(
      departmentApi.get('/departments', { params: keyword ? { keyword } : undefined })
    ),
  create: (payload: Record<string, unknown>) =>
    unwrap<import('../types').Department>(departmentApi.post('/departments', payload)),
  getById: (id: string) =>
    unwrap<import('../types').Department>(departmentApi.get(`/departments/${id}`)),
  update: (id: string, payload: Record<string, unknown>) =>
    unwrap<import('../types').Department>(departmentApi.patch(`/departments/${id}`, payload))
};

export const schedulesApi = {
  list: (departmentId: string, params?: { dateFrom?: string; dateTo?: string }) =>
    unwrap<import('../types').DutySchedule[]>(
      departmentApi.get(`/departments/${departmentId}/schedules`, { params })
    ),
  create: (departmentId: string, payload: Record<string, unknown>) =>
    unwrap<import('../types').DutySchedule>(
      departmentApi.post(`/departments/${departmentId}/schedules`, payload)
    ),
  update: (departmentId: string, scheduleId: string, payload: Record<string, unknown>) =>
    unwrap<import('../types').DutySchedule>(
      departmentApi.patch(`/departments/${departmentId}/schedules/${scheduleId}`, payload)
    ),
  remove: (departmentId: string, scheduleId: string) =>
    unwrap<{ id: string; deleted: boolean }>(
      departmentApi.delete(`/departments/${departmentId}/schedules/${scheduleId}`)
    )
};
