import { createPool } from '@hospital/common';
import { env } from './env.js';

export const pool = createPool(env.databaseUrl);
