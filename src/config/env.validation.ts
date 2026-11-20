/** Valida variables de entorno al arrancar (el BoilerPlate original no lo hacía). */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT debe ser un entero mayor a cero');
  }
  const env = String(config.NODE_ENV ?? 'development');
  if (!['development', 'test', 'production'].includes(env)) {
    throw new Error('NODE_ENV debe ser development, test o production');
  }
  return config;
}
