import bcrypt from 'bcryptjs';
import { AppError, ErrorCodes, signToken, type AuthUser } from '@hospital/common';
import { env } from '../env.js';
import { userRepository } from '../repositories/user.repository.js';
import { toPublicUser } from '../types.js';

export async function login(username: string, password: string) {
  const row = await userRepository.findByUsername(username);
  if (!row) {
    throw new AppError(ErrorCodes.INVALID_CREDENTIALS, '用户名或密码错误', 401);
  }
  if (row.status !== 'ACTIVE') {
    throw new AppError(ErrorCodes.FORBIDDEN, '账号已被停用，请联系管理员', 403);
  }

  const matched = await bcrypt.compare(password, row.password_hash);
  if (!matched) {
    throw new AppError(ErrorCodes.INVALID_CREDENTIALS, '用户名或密码错误', 401);
  }

  const authUser: AuthUser = {
    sub: row.id,
    username: row.username,
    role: row.role,
    departmentId: row.department_id
  };
  const accessToken = await signToken(authUser, {
    secret: env.jwtSecret,
    expiresIn: env.jwtExpiresIn
  });

  return { accessToken, tokenType: 'Bearer', user: toPublicUser(row) };
}
