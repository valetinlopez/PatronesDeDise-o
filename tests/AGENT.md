# Tests - Pruebas

## Responsabilidad

- `tests/unit/pricing.test.ts`: cada estrategia por separado, límites de rangos, ejemplo del TP ($82.675), orden/cascada del motor y extensibilidad con una estrategia inline
- `tests/unit/pedido-chain.test.ts`: cadena aprobada, rechazo por stock/pago/cliente, **los handlers siguientes no se ejecutan** (spy), orden, cadenas independientes
- `tests/unit/desafio.test.ts`: `DescuentoBlackFriday` y `ValidarLimiteCompra` (posición en la cadena, límites exactos, comportamiento anterior intacto)
- `tests/integration/ventas.e2e.test.ts`: API real con SQLite en memoria (venta, VIP + envío, cotizar, cada rechazo de la cadena, validaciones, integridad referencial)
- `tests/setup.ts`: fija `NODE_ENV=test`, `LOG_LEVEL=silent`, `DB_PATH=:memory:`

## Reglas para AI Agents

- Patrón AAA y `describe('Entidad') > it('should ...')`.
- Cada estrategia y cada handler nuevo lleva su test unitario.
- Un test de la **mecánica** de la cadena arma su propia lista con `construirCadena([...])`: **no** debe depender de `crearHandlersDePedido()`, porque agregar un handler al registry no debe romperlo. Solo los tests del registry lo usan.
- Verificar el corte de la cadena con `jest.spyOn(handler, 'handle')` y `not.toHaveBeenCalled()`.
- Los e2e usan `configureApp(app)` de `src/app.setup.ts` y llaman a `SeedService.run()` explícitamente. Las ventas requieren `pago`.
- Si un e2e crea una venta, la cancela al final para no alterar el stock de los demás tests.
- Cobertura objetivo: 80% o más.
