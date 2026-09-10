import { AppError, ErrorCodes, ConflictError, isPgUniqueViolation, NotFoundError } from '@hospital/common';
import { departmentRepository } from '../repositories/department.repository.js';
import {
  scheduleRepository,
  type CreateScheduleData,
  type UpdateScheduleData
} from '../repositories/schedule.repository.js';
import { toDutySchedule } from '../types.js';

export const scheduleService = {
  async list(params: { departmentId: string; dateFrom?: string; dateTo?: string }) {
    const department = await departmentRepository.findById(params.departmentId);
    if (!department) throw new NotFoundError('科室');
    const rows = await scheduleRepository.list(params);
    return rows.map(toDutySchedule);
  },

  async create(input: CreateScheduleData) {
    const department = await departmentRepository.findById(input.departmentId);
    if (!department) throw new NotFoundError('科室');
    try {
      const row = await scheduleRepository.create(input);
      return toDutySchedule(row);
    } catch (err) {
      if (isPgUniqueViolation(err)) {
        throw new ConflictError('该科室当天该班次已安排值班，或同一人员存在重复排班');
      }
      throw err;
    }
  },

  async update(id: string, input: UpdateScheduleData) {
    const existing = await scheduleRepository.findById(id);
    if (!existing) throw new NotFoundError('值班记录');
    try {
      const row = await scheduleRepository.update(id, input);
      return toDutySchedule(row!);
    } catch (err) {
      if (isPgUniqueViolation(err)) {
        throw new ConflictError('排班时间冲突：该科室班次已有人值班或人员重复');
      }
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    const deleted = await scheduleRepository.delete(id);
    if (!deleted) throw new NotFoundError('值班记录');
  },

  /** 校验操作者对值班记录所属科室的权限（非 ADMIN 只能操作本科室） */
  async assertDepartmentScope(userDepartmentId: string | null, scheduleId: string): Promise<void> {
    if (userDepartmentId === null) return; // ADMIN
    const row = await scheduleRepository.findById(scheduleId);
    if (!row) throw new NotFoundError('值班记录');
    if (row.department_id !== userDepartmentId) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        '只能管理本科室的值班信息',
        403
      );
    }
  }
};
