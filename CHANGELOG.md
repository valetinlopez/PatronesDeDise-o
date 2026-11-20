# Changelog

Todos los cambios notables de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2026-11-20

### Agregado
- **Strategy** (`ventas/pricing/`): `PricingStrategy`, `PricingEngine` (Context, cascada ordenada por prioridad) y 9 estrategias del TP: cliente común/premium/VIP, descuento por cantidad (>5, >10), promoción especial parametrizable, retiro en sucursal, envío normal y express
- **Chain of Responsibility** (`ventas/rules/`): `PedidoHandler`, `AbstractPedidoHandler` (Template Method), `construirCadena` y los handlers `ValidarCliente`, `ValidarStock`, `ValidarPago`; el rechazo corta la cadena y deja traza
- Registries únicos `pricing.registry.ts` y `pedido-handlers.registry.ts` (composition root)
- **Desafío:** `DescuentoBlackFriday` (-20%, código `BLACK_FRIDAY`) y `ValidarLimiteCompra` (50 unidades / $1.000.000) agregados sin modificar los archivos existentes (verificado por hash SHA-1)
- `Cliente.tipo` (COMUN, PREMIUM, VIP); en `Venta`: `subtotal`, `envio`, `medioPago`; `POST /ventas` recibe `envio`, `promociones` y `pago` (obligatorio)
- `POST /ventas/cotizar`: calcula el precio y las estrategias aplicadas sin crear la venta
- `npm run demo`: 5 escenarios por consola (aprobado, stock, pago y los dos del Desafío)
- Cliente VIP de ejemplo (Lucia Gomez) en el seed
- `docs/DIAGRAMA-CLASES.md` (UML en Mermaid) y README reescrito como guía de estudio
- Tests: 47 (estrategias, motor, cadena, Desafío, e2e)

### Cambiado
- `VentasService.crear`: calcula el precio, luego ejecuta la cadena y recién entonces guarda; un rechazo hace rollback
- Un cliente bloqueado con producto inexistente ahora responde 404 (el producto se carga antes por el cálculo de precio)
- `total` de la venta es el precio final tras las estrategias; `subtotal` es el precio de lista

### Eliminado
- `VentaRulesRunner`, las 4 reglas secuenciales y `PrecioBaseStrategy` (reemplazados por la cadena y el motor)

### Corregido
- `pago` ausente en `POST /ventas` devolvía 500; ahora 400 `El campo pago es obligatorio`

### Nota de migración
- Si existe un `data/*.db` anterior, borrarlo para que se regenere con las columnas nuevas.

## [1.0.0] - 2026-11-19

### Agregado
- Proyecto NestJS 11 + TypeScript con TypeORM y SQLite (better-sqlite3)
- Módulos `productos`, `clientes` y `ventas` con la misma lógica de `MVCsistema-ventas`
- Repositorios detrás de interfaces y tokens de inyección (DIP)
- `TransactionContext` como implementación del puerto `TransactionRunner`
- Costura Chain of Responsibility: `ventas/rules/` con `VentaRule` y `VentaRulesRunner`
- Costura Strategy: `ventas/pricing/` con `PricingStrategy` y `PrecioBaseStrategy`
- Filtro global de excepciones e interceptor de respuesta estándar `{ success, message, data, meta }`
- Paginación con `meta.total` real
- Swagger (`/api-docs`), `/health`, helmet, compression y rate limit
- Logger winston, seed inicial, Dockerfile multi-stage y docker-compose con volumen
- Tests unitarios y e2e, colección Postman y `AGENT.md` por capa

### Pendiente
- Migrations de TypeORM para producción
- Autenticación
