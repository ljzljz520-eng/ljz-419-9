import { pool } from '../db.js';
import type { DutyScheduleRow } from '../types.js';

const COLUMNS =
  'id, department_id, staff_id, staff_name, duty_date, shift, note, created_at, updated_at';

export interface CreateScheduleData {
  departmentId: string;
  staffId: string;
  staffName: string;
  dutyDate: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  note: string | null;
}

export interface UpdateScheduleData {
  staffId?: string;
  staffName?: string;
  dutyDate?: string;
  shift?: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  note?: string | null;
}

export interface ListScheduleParams {
  departmentId: string;
  dateFrom?: string;
  dateTo?: string;
}

export const scheduleRepository = {
  async list(params: ListScheduleParams): Promise<DutyScheduleRow[]> {
    const conditions = ['department_id = $1'];
    const values: unknown[] = [params.departmentId];
    let idx = 2;
    if (params.dateFrom) {
      conditions.push(`duty_date >= $${idx++}`);
      values.push(params.dateFrom);
    }
    if (params.dateTo) {
      conditions.push(`duty_date <= $${idx++}`);
      values.push(params.dateTo);
    }
    const { rows } = await pool.query<DutyScheduleRow>(
      `SELECT ${COLUMNS} FROM duty_schedules
       WHERE ${conditions.join(' AND ')}
       ORDER BY duty_date ASC, shift ASC, id`,
      values
    );
    return rows;
  },

  async findById(id: string): Promise<DutyScheduleRow | null> {
    const { rows } = await pool.query<DutyScheduleRow>(
      `SELECT ${COLUMNS} FROM duty_schedules WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: CreateScheduleData): Promise<DutyScheduleRow> {
    const { rows } = await pool.query<DutyScheduleRow>(
      `INSERT INTO duty_schedules (department_id, staff_id, staff_name, duty_date, shift, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNS}`,
      [data.departmentId, data.staffId, data.staffName, data.dutyDate, data.shift, data.note]
    );
    return rows[0];
  },

  async update(id: string, data: UpdateScheduleData): Promise<DutyScheduleRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    const assign = (column: string, value: unknown): void => {
      sets.push(`${column} = $${idx++}`);
      values.push(value);
    };

    if (data.staffId !== undefined) assign('staff_id', data.staffId);
    if (data.staffName !== undefined) assign('staff_name', data.staffName);
    if (data.dutyDate !== undefined) assign('duty_date', data.dutyDate);
    if (data.shift !== undefined) assign('shift', data.shift);
    if (data.note !== undefined) assign('note', data.note);

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await pool.query<DutyScheduleRow>(
      `UPDATE duty_schedules SET ${sets.join(', ')} WHERE id = $${idx} RETURNING ${COLUMNS}`,
      values
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM duty_schedules WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
};
