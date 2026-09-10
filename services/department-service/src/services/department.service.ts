import { ConflictError, isPgUniqueViolation, NotFoundError } from '@hospital/common';
import {
  departmentRepository,
  type CreateDepartmentData,
  type UpdateDepartmentData
} from '../repositories/department.repository.js';
import { toDepartment } from '../types.js';

export const departmentService = {
  async list(keyword?: string) {
    const rows = await departmentRepository.list(keyword);
    return rows.map(toDepartment);
  },

  async getById(id: string) {
    const row = await departmentRepository.findById(id);
    if (!row) throw new NotFoundError('科室');
    return toDepartment(row);
  },

  async create(input: CreateDepartmentData) {
    try {
      const row = await departmentRepository.create(input);
      return toDepartment(row);
    } catch (err) {
      if (isPgUniqueViolation(err)) throw new ConflictError(`科室编码 ${input.code} 已存在`);
      throw err;
    }
  },

  async update(id: string, input: UpdateDepartmentData) {
    const existing = await departmentRepository.findById(id);
    if (!existing) throw new NotFoundError('科室');
    const row = await departmentRepository.update(id, input);
    return toDepartment(row!);
  }
};
