# Database - Persistencia

## Responsabilidad

Esta capa es responsable de:
- `database.module.ts`: conexión TypeORM + better-sqlite3 (global). Activa `foreign_keys = ON`
- `transaction-context.ts`: implementa `TransactionRunner` con `AsyncLocalStorage`; los repositorios piden `tx.manager`
- `seeds/seed.service.ts`: mismos productos que el original y 4 clientes con `tipo` (Juan COMUN, Maria PREMIUM, Carlos VIP bloqueado, Lucia VIP) solo si las 3 tablas están vacías; no corre con `NODE_ENV=test` (los e2e lo invocan a mano)

## Reglas para AI Agents

- Toda entidad nueva se registra en `entities` de `database.module.ts`.
- Los repositorios **siempre** usan `this.tx.manager.getRepository(...)`, nunca un `Repository` inyectado: si no, quedan fuera de la transacción.
- `synchronize` es solo para desarrollo/test. Para producción real migrar a migrations.
- Para cambiar a PostgreSQL basta con cambiar el driver aquí; los services no se ven afectados.
