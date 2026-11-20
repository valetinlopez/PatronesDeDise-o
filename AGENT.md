# Sistema de Ventas NestJS MVC — AI Agent Guide

## Propósito

API REST de ventas (productos, clientes, ventas) en **NestJS + TypeScript + TypeORM (SQLite)**.
Replica el dominio de `MVCsistema-ventas` y la arquitectura/documentación de `BoilerPlate`.
Implementa el TP de **Patrones de Diseño**: **Strategy** (precio final de la compra) y **Chain of Responsibility** (validación del pedido), construidos sobre **SOLID**. El `README.md` es una guía de estudio de ambos.

## Arquitectura de Capas

```
┌──────────────────────────────────────────────┐
│  HTTP  (Guards / Pipes / Interceptors)       │  common/, app.setup.ts
└───────────────────────┬──────────────────────┘
                        ▼
┌──────────────────────────────────────────────┐
│  Controller   solo HTTP, devuelve ServiceResult │  *.controller.ts
└───────────────────────┬──────────────────────┘
                        ▼
┌──────────────────────────────────────────────┐
│  Service      casos de uso, sin req/res      │  *.service.ts
│   ├─ rules/    validación del pedido: Chain of Responsibility (handlers)
│   └─ pricing/  precio final: Strategy (PricingEngine + estrategias)
└───────────────────────┬──────────────────────┘
                        ▼   (depende de interfaces: DIP)
┌──────────────────────────────────────────────┐
│  Repository   interfaz + impl TypeORM       │  repositories/
└───────────────────────┬──────────────────────┘
                        ▼
┌──────────────────────────────────────────────┐
│  Entity / SQLite                             │  entities/, database/
└──────────────────────────────────────────────┘
```

Flujo de errores: `throw AppError` → `AllExceptionsFilter` → `{ success:false, error }`.
Flujo de éxito: controller devuelve `ServiceResult` → `TransformResponseInterceptor` → `{ success:true, message, data, meta? }`.

## Convenciones

- Estructura **por feature**: `src/modules/<feature>/{dto,entities,repositories}` + module/controller/service.
- Naming: clases `PascalCase`, archivos `kebab-case` con sufijo de rol (`*.service.ts`, `*.entity.ts`, `*.dto.ts`), métodos `camelCase`, constantes/tokens `UPPER_SNAKE_CASE`.
- Los services dependen de **tokens + interfaces** (`PRODUCTO_REPOSITORY`, `TRANSACTION_RUNNER`, `PRICING_STRATEGIES`, `PEDIDO_CHAIN`), nunca de TypeORM.
- Rutas bajo `/api/v1`. `/health` queda fuera del prefijo. Swagger en `/api-docs`.
- Mensajes de error y validación en español (idénticos a `MVCsistema-ventas`).

### Códigos HTTP

| Código | Uso |
|---|---|
| 200 | GET, PUT, DELETE exitosos (DELETE devuelve el recurso) |
| 201 | POST exitoso |
| 400 | Validación o regla de negocio (`VALIDATION_ERROR`, `CLIENTE_BLOQUEADO`, `STOCK_INSUFICIENTE`, `LIMITE_COMPRA_EXCEDIDO`, `PAGO_RECHAZADO`, ...) |
| 404 | Recurso inexistente (`NOT_FOUND`, `ROUTE_NOT_FOUND`) |
| 429 | Rate limit |
| 500 | Error no controlado (`INTERNAL_ERROR`) |

## AGENT.md por Carpeta

| Carpeta | Archivo |
|---|---|
| `src/config/` | `src/config/AGENT.md` |
| `src/database/` | `src/database/AGENT.md` |
| `src/common/` | `src/common/AGENT.md` |
| `src/modules/productos/` | `src/modules/productos/AGENT.md` |
| `src/modules/clientes/` | `src/modules/clientes/AGENT.md` |
| `src/modules/ventas/` | `src/modules/ventas/AGENT.md` |
| `src/modules/ventas/rules/` | `src/modules/ventas/rules/AGENT.md` |
| `src/modules/ventas/pricing/` | `src/modules/ventas/pricing/AGENT.md` |
| `tests/` | `tests/AGENT.md` |
| `scripts/` | `scripts/AGENT.md` |

## Patrones: cómo extender sin modificar

| Quiero... | Hago | Edito |
|---|---|---|
| Una nueva regla de precio (descuento, promo, cargo) | Clase en `ventas/pricing/strategies/` (extiende `DescuentoPorcentualStrategy` o `CargoFijoStrategy`) | **1 línea** en `pricing.registry.ts` |
| Un nuevo control del pedido | Clase en `ventas/rules/handlers/` (extiende `AbstractPedidoHandler`, implementa `validar()`) | **1 línea** en `pedido-handlers.registry.ts` (la posición define el orden) |
| Una promoción con código | — | `new PromocionEspecialStrategy('CODIGO', %)` en `pricing.registry.ts` |

Los dos registries son el *composition root*: son los únicos archivos que se editan. **Nunca** modificar una estrategia, un handler, `PricingEngine`, `AbstractPedidoHandler` ni `VentasService` para agregar una regla. Detalle en `ventas/pricing/AGENT.md` y `ventas/rules/AGENT.md`.

## Checklist para Nuevos Módulos

Al agregar un módulo (ej: `Proveedor`), seguir este orden:

- [ ] `src/modules/proveedores/entities/proveedor.entity.ts` — Entidad TypeORM (y registrarla en `database.module.ts`)
- [ ] `src/modules/proveedores/dto/create-proveedor.dto.ts` y `update-proveedor.dto.ts` — Validación con class-validator
- [ ] `src/modules/proveedores/repositories/proveedor.repository.interface.ts` — Interfaz + token
- [ ] `src/modules/proveedores/repositories/proveedor.typeorm.repository.ts` — Implementación (usar `TransactionContext.manager`)
- [ ] `src/modules/proveedores/proveedores.service.ts` — Lógica de negocio
- [ ] `src/modules/proveedores/proveedores.controller.ts` — Endpoints (devolver `ServiceResult`)
- [ ] `src/modules/proveedores/proveedores.module.ts` — Registrar providers y exportar el service
- [ ] Importar el módulo en `src/app.module.ts`
- [ ] `src/modules/proveedores/AGENT.md`
- [ ] Tests en `tests/unit/` y `tests/integration/`
- [ ] Actualizar `docs/postman_collection.json` y `CHANGELOG.md`

## Reglas de Generación

### Prohibido
- Importar `typeorm` o `@nestjs/typeorm` en un `*.service.ts` o en `rules/` / `pricing/`
- Acceder a `req` / `res` en services
- Poner reglas de negocio (`if` de dominio) dentro de `VentasService`: van en `rules/` o `pricing/`
- Hacer que una estrategia o un handler dependa de otro (cada uno es independiente)
- Acceder a base de datos o a servicios desde una estrategia o un handler (son puros)
- Lanzar excepciones desde `validar()` de un handler: se usa `this.rechazar(...)`
- Usar `console.log` en lugar de `Logger`
- Lanzar `Error` genérico para errores de negocio (usar `AppError` y subclases)
- Crear dependencias circulares entre módulos (usar el repositorio para consultas cruzadas)

### Requerido
- `async/await` en lugar de `.then().catch()`
- Inyección por constructor con token cuando existe interfaz
- Transacciones solo vía `TRANSACTION_RUNNER`
- DTOs con mensajes de validación en español
- Documentar en el `AGENT.md` del módulo cualquier cambio estructural

## Dependencias Principales

| Paquete | Uso |
|---|---|
| `@nestjs/*` 11 | Framework |
| `typeorm` + `better-sqlite3` | Persistencia SQLite |
| `class-validator` / `class-transformer` | DTOs |
| `@nestjs/swagger` | Documentación OpenAPI |
| `nest-winston` / `winston` | Logger |
| `helmet`, `compression`, `@nestjs/throttler` | Seguridad y rate limit |
| `jest`, `ts-jest`, `supertest` | Testing |

## Scripts

| Script | Descripción |
|---|---|
| `npm run demo` | Escenarios del TP por consola (sin DB) |
| `npm run start:dev` | Desarrollo con recarga |
| `npm run build` / `npm start` | Compilar / ejecutar `dist/` |
| `npm test` | Todos los tests con cobertura |
| `npm run test:unit` / `test:e2e` | Unitarios / integración |
| `npm run lint` / `lint:fix` / `format` | Calidad de código |

## Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test` o `production` |
| `PORT` | `3000` | Puerto HTTP |
| `API_PREFIX` | `api/v1` | Prefijo global |
| `DB_PATH` | `data/sistema-ventas.db` | Archivo SQLite (`:memory:` en tests) |
| `DB_SYNCHRONIZE` | `true` | Sincroniza el esquema (solo desarrollo/test) |
| `LOG_LEVEL` | `info` | Nivel de winston (`silent` desactiva) |
| `RATE_LIMIT_TTL_MS` | `900000` | Ventana del rate limit |
| `RATE_LIMIT_MAX` | `100` | Requests por ventana |
