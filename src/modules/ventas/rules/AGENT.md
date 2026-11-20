# Rules - Validación del Pedido (patrón Chain of Responsibility)

## Responsabilidad

Esta carpeta es responsable de:
- `pedido-handler.interface.ts`: contrato `PedidoHandler` (`setNext`, `handle`) y token `PEDIDO_CHAIN`
- `abstract-pedido.handler.ts`: base con el algoritmo común (Template Method): ejecuta `validar()`, registra el paso en la traza, **corta** si falla o **delega** en el siguiente
- `pedido-context.ts`: `PedidoContext` (datos del pedido + `traza`), `ResultadoPaso`, `ResultadoPedido`
- `pedido-chain.builder.ts`: `construirCadena(handlers)` enlaza con `setNext` en el orden recibido
- `handlers/`: un handler por control
- `pedido-handlers.registry.ts`: `crearHandlersDePedido()`, define **el orden de la cadena**

## Cadena actual (en orden)

| # | Handler | Rechaza cuando | Código | HTTP |
|---|---|---|---|---|
| 1 | `ValidarClienteHandler` | cliente bloqueado | `CLIENTE_BLOQUEADO` | 400 |
| 2 | `ValidarStockHandler` | stock < cantidad | `STOCK_INSUFICIENTE` | 400 |
| 3 | `ValidarLimiteCompraHandler` (Desafío) | > 50 unidades o > $1.000.000 | `LIMITE_COMPRA_EXCEDIDO` | 400 |
| 4 | `ValidarPagoHandler` | `saldoDisponible` < precio final | `PAGO_RECHAZADO` | 400 |

Cliente o producto inexistentes **no** pasan por la cadena: `VentasService` responde 404 antes.

## Reglas para AI Agents

- Un handler = una validación = un archivo en `handlers/`. Extiende `AbstractPedidoHandler` e implementa **solo** `validar()`.
- En `validar()` usar `this.aprobar(detalle)` o `this.rechazar(new BusinessRuleError(mensaje, 'CODIGO'), detalle)`. **No lanzar excepciones** y **no llamar al siguiente handler a mano**: lo hace la base.
- Los handlers son **puros**: sin inyección, sin base de datos, sin `req/res`. Reciben todo en el `PedidoContext` (cliente, producto y precio final ya cargados por `VentasService`).
- El rechazo es un **valor** (`ResultadoPedido`), no una excepción: la cadena se corta devolviéndolo. `VentasService` lanza `resultado.error` una sola vez, fuera de la cadena.
- El **orden** de `crearHandlersDePedido()` es el orden de ejecución: barato/probable primero, cobrar al final.
- `crearHandlersDePedido()` es una **función** porque cada handler guarda su `siguiente`: cada cadena necesita instancias propias.
- **No modificar** handlers existentes para agregar controles: crear uno nuevo, sumarlo en el registry (una línea) y agregar test.
- Los tests de handlers arman su propia lista con `construirCadena([...])`; no dependen de `crearHandlersDePedido()` salvo los que verifican el registry.
- Si un handler necesita otra política (ej. advertir y continuar), puede sobreescribir `handle()`.

## Cómo agregar un control

1. `handlers/validar-xxx.handler.ts` extendiendo `AbstractPedidoHandler` (`nombre` único, `validar()`).
2. Insertar `new ValidarXxxHandler()` en `crearHandlersDePedido()` en la posición deseada.
3. Test unitario: aprueba, rechaza con su código, y los siguientes **no** se ejecutan (spy sobre `handle`).
4. Actualizar la tabla de arriba y el `CHANGELOG.md`.
