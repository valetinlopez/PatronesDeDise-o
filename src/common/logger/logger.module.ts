import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const level = process.env.LOG_LEVEL ?? 'info';
const silent = level === 'silent' || process.env.NODE_ENV === 'test';
const writeFiles = !silent && process.env.NODE_ENV !== 'production';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level: l, message, context }) =>
      `${timestamp} [${String(l).toUpperCase()}]${context ? ` (${context})` : ''}: ${message}`
  )
);

export const winstonInstance = winston.createLogger({
  level: silent ? 'error' : level,
  silent,
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), format),
    }),
    ...(writeFiles
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

@Module({ imports: [WinstonModule.forRoot({ instance: winstonInstance })] })
export class LoggerModule {}
