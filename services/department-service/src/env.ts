import dotenv from 'dotenv';
import { requireEnv, optionalEnv } from '@hospital/common';

dotenv.config();

export const env = {
  port: Number(optionalEnv('PORT', '3002')),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  logLevel: optionalEnv('LOG_LEVEL', 'info')
};
