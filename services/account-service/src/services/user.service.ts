import bcrypt from 'bcryptjs';
import { ConflictError, isPgUniqueViolation, NotFoundError } from '@hospital/common';
import type { Role } from '@hospital/common';
import { userRepository, type ListUserParams, type UpdateUserData } from '../repositories/user.repository.js';
import { toPublicUser } from '../types.js';

const SALT_ROUNDS = 10;

export const userService = {
  async create(input: {
    username: string;
    password: string;
    fullName: string;
    role: Role;
    departmentId: string | null;
  }) {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    try {
      const row = await userRepository.create({
        username: input.username,
        passwordHash,
        fullName: input.fullName,
        role: input.role,
        departmentId: input.departmentId
      });
      return toPublicUser(row);
    } catch (err) {
      if (isPgUniqueViolation(err)) {
        throw new ConflictError(`用户名 ${input.username} 已存在`);
      }
      throw err;
    }
  },

  async getById(id: string) {
    const row = await userRepository.findById(id);
    if (!row) throw new NotFoundError('用户');
    return toPublicUser(row);
  },

  async update(id: string, input: UpdateUserData & { password?: string }) {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError('用户');

    const data: UpdateUserData = { ...input };
    delete (data as UpdateUserData & { password?: string }).password;
    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    }

    try {
      const row = await userRepository.update(id, data);
      return toPublicUser(row!);
    } catch (err) {
      if (isPgUniqueViolation(err)) throw new ConflictError('用户名已存在');
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    const deleted = await userRepository.delete(id);
    if (!deleted) throw new NotFoundError('用户');
  },

  async list(params: ListUserParams) {
    const { items, total } = await userRepository.list(params);
    return {
      items: items.map(toPublicUser),
      page: params.page,
      pageSize: params.pageSize,
      total
    };
  }
};
