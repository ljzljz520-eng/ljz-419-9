import type { Role } from '@hospital/common';

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  status: 'ACTIVE' | 'DISABLED';
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    departmentId: row.department_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
