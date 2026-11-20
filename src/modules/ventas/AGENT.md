# Ventas - Módulo de Ventas

## Responsabilidad

Esta capa es responsable de:
- Registrar ventas (`POST`), cotizar (`POST /cotizar`), consultarlas (`GET`) y cancelarlas (`DELETE`)
- Orquestar el caso de uso `crear` dentro de **una transacción**
- Mantener coherente el stock del producto

## Estructura

```
ventas/
├── dto/            cotizar-venta.dto.ts (base)  ·  create-venta.dto.ts (+ pago)
├── entities/       venta.entity.ts · metodo-envio.enum.ts · medio-pago.enum.ts
├── repositories/   IVentaRepository + VentaTypeOrmRepository
├── pricing/        STRATEGY: precio final           (ver pricing/AGENT.md)
├── rules/          CHAIN: validación del pedido     (ver rules/AGENT.md)
├── ventas.service.ts  ventas.controller.ts  ventas.module.ts
```

## Flujo `crear`

`TRANSACTION_RUNNER.run` →
1. cargar cliente y producto (404 `Cliente/Producto no encontrado`)
2. `PricingEngine.calcular(...)` → subtotal, pasos, total **(Strategy)**
3. `PEDIDO_CHAIN.handle({cliente, producto, cantidad, precioFinal, pago, traza})` **(Chain)**
4. si `!aprobado` → `throw resultado.error` → **rollback** (nada se guarda)
5. si aprobado → `ProductosService.ajustarStock(-cantidad)` + `IVentaRepository.create` (guarda `subtotal`, `envio`, `medioPago`, `total`, `fecha` YYYY-MM-DD)

La traza de la cadena se escribe en el log (`Logger`) paso a paso.

## Flujo `cotizar`

Solo el paso 2: devuelve `{ subtotal, pasos[], total }`. No valida stock ni pago, no persiste, no cambia stock.

## Flujo `cancelar`

Transacción: busca la venta (404 `Venta no encontrada`) → `ajustarStock(+cantidad)` → borra la venta → devuelve la venta eliminada.

## Reglas para AI Agents

- `VentasService` **orquesta**: no contiene reglas de precio ni de validación. Esas viven en `pricing/` y `rules/`.
- `pago` es **obligatorio** en `CreateVentaDto` (`@IsDefined` + `@ValidateNested`); sin él la API responde 400.
- Depende de `ProductosService` y `ClientesService` (exportados), nunca de sus repositorios.
- Las ventas no se modifican (no hay `PUT`).
- Los otros módulos consultan "tiene ventas asociadas" con una consulta directa en su propio repositorio, para evitar dependencia circular.
- Cambio respecto al original: un cliente bloqueado con producto inexistente ahora responde 404 (el producto se carga antes de la cadena porque el precio lo necesita).
