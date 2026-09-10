import { createApp } from './app.js';
import { pool } from './db.js';
import { env } from './env.js';

const { app, logger } = createApp();

const server = app.listen(env.port, () => {
  logger.info({ port: env.port }, 'department-service 已启动');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, '正在关闭 department-service');
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
