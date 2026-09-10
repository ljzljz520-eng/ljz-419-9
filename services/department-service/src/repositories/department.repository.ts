import { pool } from '../db.js';
import type { DepartmentRow } from '../types.js';

const COLUMNS =
  'id, code, name, description, location, contact_phone, head_doctor_id, status, created_at, updated_at';

export interface CreateDepartmentData {
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  contactPhone: string | null;
  headDoctorId: string | null;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string | null;
  location?: string | null;
  contactPhone?: string | null;
  headDoctorId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export const departmentRepository = {
  async list(keyword?: string): Promise<DepartmentRow[]> {
    if (keyword) {
      const { rows } = await pool.query<DepartmentRow>(
        `SELECT ${COLUMNS} FROM departments
         WHERE name ILIKE $1 OR code ILIKE $1
         ORDER BY created_at DESC, id`,
        [`%${keyword}%`]
      );
      return rows;
    }
    const { rows } = await pool.query<DepartmentRow>(
      `SELECT ${COLUMNS} FROM departments ORDER BY created_at DESC, id`
    );
    return rows;
  },

  async findById(id: string): Promise<DepartmentRow | null> {
    const { rows } = await pool.query<DepartmentRow>(
      `SELECT ${COLUMNS} FROM departments WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: CreateDepartmentData): Promise<DepartmentRow> {
    const { rows } = await pool.query<DepartmentRow>(
      `INSERT INTO departments (code, name, description, location, contact_phone, head_doctor_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNS}`,
      [data.code, data.name, data.description, data.location, data.contactPhone, data.headDoctorId]
    );
    return rows[0];
  },

  async update(id: string, data: UpdateDepartmentData): Promise<DepartmentRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const assign = (column: string, value: unknown): void => {
      sets.push(`${column} = $${idx++}`);
      values.push(value);
    };

    if (data.name !== undefined) assign('name', data.name);
    if (data.description !== undefined) assign('description', data.description);
    if (data.location !== undefined) assign('location', data.location);
    if (data.contactPhone !== undefined) assign('contact_phone', data.contactPhone);
    if (data.headDoctorId !== undefined) assign('head_doctor_id', data.headDoctorId);
    if (data.status !== undefined) assign('status', data.status);

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await pool.query<DepartmentRow>(
      `UPDATE departments SET ${sets.join(', ')} WHERE id = $${idx} RETURNING ${COLUMNS}`,
      values
    );
    return rows[0] ?? null;
  }
};
