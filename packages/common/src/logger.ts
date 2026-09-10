/**
 * 统一日志规范（docs/standards/logging.md）：
 * 结构化 JSON 日志，固定字段 service / level / time / msg / requestId / userId，
 * 敏感字段 password / token / authorization 一律脱敏。
 */
import pino from 'pino';

export type ServiceLogger = pino.Logger;

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'newPassword',
  'oldPassword',
  'token',
  'accessToken'
];

export function createLogger(options: { service: string; level?: string }): ServiceLogger {
  return pino({
    name: options.service,
    level: options.level ?? process.env.LOG_LEVEL ?? 'info',
    base: { service: options.service },
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label })
    }
  });
}

export function createChildLogger(logger: ServiceLogger, fields: Record<string, unknown>): ServiceLogger {
  return logger.child(fields);
}
