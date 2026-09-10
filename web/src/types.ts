export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  contactPhone: string | null;
  headDoctorId: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export type Shift = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export interface DutySchedule {
  id: string;
  departmentId: string;
  staffId: string;
  staffName: string;
  dutyDate: string;
  shift: Shift;
  note: string | null;
}

export interface PageData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const SHIFT_LABELS: Record<Shift, string> = {
  MORNING: '早班',
  AFTERNOON: '午班',
  NIGHT: '夜班'
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: '管理员',
  DOCTOR: '医生',
  NURSE: '护士'
};
