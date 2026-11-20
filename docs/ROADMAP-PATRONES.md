# Roadmap de Patrones

Estado de cada paso planificado y qué sigue. La explicación de fondo está en el `README.md` (guía de estudio).

## Hecho

| Paso | Estado | Dónde |
|---|---|---|
| SOLID: repositorios por interfaz + tokens, transacción como puerto, service que solo orquesta | ✅ | `common/interfaces`, `database/transaction-context.ts`, `ventas.service.ts` |
| **Strategy** del precio (9 estrategias, motor en cascada, promociones parametrizables) | ✅ | `ventas/pricing/` |
| **Chain of Responsibility** del pedido (Cliente → Stock → Pago, corte en el primer rechazo, traza) | ✅ | `ventas/rules/` |
| **Desafío**: `DescuentoBlackFriday` + `ValidarLimiteCompra` sin modificar lo existente | ✅ | `descuento-black-friday.strategy.ts`, `validar-limite-compra.handler.ts` |
| Demo por consola con 5 escenarios | ✅ | `scripts/demo.ts` |
| Diagrama UML | ✅ | `docs/DIAGRAMA-CLASES.md` |

## SOLID — estado

| Principio | Estado actual | Posible mejora |
|---|---|---|
| S | Una clase por regla y por control; `VentasService` solo orquesta | Separar `crear` y `cancelar` en casos de uso si crecen |
| O | Nuevas estrategias/handlers = archivo + 1 línea en el registry | Descubrimiento automático con decoradores (elimina el edit del registry) |
| L | Cualquier `PricingStrategy` / `PedidoHandler` es intercambiable | Tests de contrato compartidos para todas las implementaciones |
| I | Interfaces chicas; `IVentaRepository` sin `update` | Separar repositorios de lectura y escritura |
| D | Services dependen de tokens e interfaces; handlers y estrategias puros | Repositorio en memoria para tests sin SQLite |

## Ideas siguientes (no implementadas)

- **Strategy**
  - Descuento por primera compra y por monto mínimo.
  - Impuestos (IVA) como estrategia de prioridad 80, o decorador `ConImpuesto(inner)`.
  - Promociones con vigencia (fechas) y tope de acumulación (regla "máximo 2 promociones").
  - Persistir los `pasos` del cálculo junto con la venta para auditoría.
- **Chain**
  - Handler de horario de venta y de producto descontinuado.
  - Handler "advertencia" que registra y continúa (sobreescribiendo `handle`).
  - Validación de cantidad máxima por tipo de cliente.
- **Dominio**
  - Venta con múltiples ítems (hoy es un producto por venta, igual que el sistema original).
  - Pasarela de pago real detrás de una interfaz `PaymentGateway`.
  - Migrations de TypeORM y autenticación.
