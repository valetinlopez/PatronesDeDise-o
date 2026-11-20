import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL_MS ?? '900000', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },
}));
