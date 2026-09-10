export interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_phone: string | null;
  head_doctor_id: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
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

export interface DutyScheduleRow {
  id: string;
  department_id: string;
  staff_id: string;
  staff_name: string;
  duty_date: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DutySchedule {
  id: string;
  departmentId: string;
  staffId: string;
  staffName: string;
  dutyDate: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    location: row.location,
    contactPhone: row.contact_phone,
    headDoctorId: row.head_doctor_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toDutySchedule(row: DutyScheduleRow): DutySchedule {
  return {
    id: row.id,
    departmentId: row.department_id,
    staffId: row.staff_id,
    staffName: row.staff_name,
    // 连接池已将 DATE 解析为 YYYY-MM-DD 字符串
    dutyDate: row.duty_date,
    shift: row.shift,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
