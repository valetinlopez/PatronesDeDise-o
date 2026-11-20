# Config - Configuración

## Responsabilidad

Esta capa es responsable de:
- `app.config.ts`: `env`, `port`, `apiPrefix`, `logLevel`, `rateLimit` (namespace `app`)
- `database.config.ts`: `path`, `synchronize` (namespace `database`)
- `env.validation.ts`: valida `PORT` y `NODE_ENV` al arrancar

## Reglas para AI Agents

- Leer configuración con `ConfigService.getOrThrow('app.port')`; no usar `process.env` fuera de `config/` (excepción: `logger.module.ts`, que se evalúa antes de DI).
- Toda variable nueva se agrega aquí, en `.env.example` y en la tabla del `AGENT.md` raíz.
- No dejar secretos con valores por defecto inseguros.
