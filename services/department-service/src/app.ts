import express from 'express';
import { randomUUID as cryptoRandomUUID } from 'node:crypto';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { createLogger, errorHandler, notFoundHandler } from '@hospital/common';
import { env } from './env.js';
import { router } from './routes/index.js';

export function createApp() {
  const app = express();
  const logger = createLogger({ service: 'department-service', level: env.logLevel });

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) =>
        (req.headers['x-request-id'] as string | undefined) ?? cryptoRandomUUID(),
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      }
    })
  );

  app.use('/api/v1', router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, logger };
}
