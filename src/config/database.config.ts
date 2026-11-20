import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  path: process.env.DB_PATH ?? 'data/sistema-ventas.db',
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
}));
