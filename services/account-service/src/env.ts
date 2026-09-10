import dotenv from 'dotenv';
import { requireEnv, optionalEnv } from '@hospital/common';

dotenv.config();

export const env = {
  port: Number(optionalEnv('PORT', '3001')),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '8h'),
  logLevel: optionalEnv('LOG_LEVEL', 'info')
};
