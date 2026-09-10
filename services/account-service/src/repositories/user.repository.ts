import { pool } from '../db.js';
import type { Role } from '@hospital/common';
import type { UserRow } from '../types.js';

export interface CreateUserData {
  username: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  status?: 'ACTIVE' | 'DISABLED';
}

export interface UpdateUserData {
  fullName?: string;
  role?: Role;
  departmentId?: string | null;
  status?: 'ACTIVE' | 'DISABLED';
  passwordHash?: string;
}

export interface ListUserParams {
  page: number;
  pageSize: number;
  role?: Role;
  departmentId?: string;
  status?: 'ACTIVE' | 'DISABLED';
}

const USER_COLUMNS =
  'id, username, password_hash, full_name, role, department_id, status, created_at, updated_at';

export const userRepository = {
  async findByUsername(username: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users WHERE username = $1`,
      [username]
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: CreateUserData): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (username, password_hash, full_name, role, department_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${USER_COLUMNS}`,
      [
        data.username,
        data.passwordHash,
        data.fullName,
        data.role,
        data.departmentId,
        data.status ?? 'ACTIVE'
      ]
    );
    return rows[0];
  },

  async update(id: string, data: UpdateUserData): Promise<UserRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.fullName !== undefined) {
      sets.push(`full_name = $${idx++}`);
      values.push(data.fullName);
    }
    if (data.role !== undefined) {
      sets.push(`role = $${idx++}`);
      values.push(data.role);
    }
    if (data.departmentId !== undefined) {
      sets.push(`department_id = $${idx++}`);
      values.push(data.departmentId);
    }
    if (data.status !== undefined) {
      sets.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.passwordHash !== undefined) {
      sets.push(`password_hash = $${idx++}`);
      values.push(data.passwordHash);
    }

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await pool.query<UserRow>(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING ${USER_COLUMNS}`,
      values
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },

  async list(params: ListUserParams): Promise<{ items: UserRow[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (params.role) {
      conditions.push(`role = $${idx++}`);
      values.push(params.role);
    }
    if (params.departmentId) {
      conditions.push(`department_id = $${idx++}`);
      values.push(params.departmentId);
    }
    if (params.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (params.page - 1) * params.pageSize;

    const listQuery = `SELECT ${USER_COLUMNS} FROM users ${where} ORDER BY created_at DESC, id LIMIT $${idx++} OFFSET $${idx++}`;
    const { rows } = await pool.query<UserRow>(listQuery, [...values, params.pageSize, offset]);
    const { rows: countRows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users ${where}`,
      values
    );

    return { items: rows, total: Number(countRows[0].count) };
  }
};
