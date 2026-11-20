# Arquitectura

## De dónde viene cada pieza

| BoilerPlate (Express) | Este proyecto (NestJS) |
|---|---|
| routes + controllers | `*.controller.ts` (solo HTTP) |
| services / BaseService | `*.service.ts` (casos de uso) |
| models / BaseModel | `entities/` + `repositories/` (interfaz + TypeORM) |
| Joi `schemas.js` | DTOs con class-validator |
| `errors.js` + `errorHandler` | `AppError` + `AllExceptionsFilter` |
| `response-helpers` | `TransformResponseInterceptor` |
| `config/index.js` | `ConfigModule` + `registerAs` |
| `requestLogger` | `LoggingInterceptor` |
| winston | `LoggerModule` |

## Decisiones

1. **Interfaces + tokens para persistencia (DIP).** Los services dependen de `IProductoRepository`, etc. Cambiar SQLite por PostgreSQL o por memoria es cambiar el provider.
2. **Transacciones como puerto.** `TransactionRunner.run(work)`. La implementación usa `AsyncLocalStorage` para que los repositorios usen el `EntityManager` transaccional sin pasarlo como parámetro.
3. **Sin dependencias circulares.** `VentasModule` importa `ProductosModule` y `ClientesModule`. Para "tiene ventas asociadas", cada repositorio consulta la tabla `ventas` directamente.
4. **Reglas y precio fuera del service.** `VentasService` solo orquesta; el precio lo calcula `PricingEngine` (Strategy, `pricing/`) y las validaciones las hace una cadena de handlers (Chain of Responsibility, `rules/`). Ambos se componen en un registry cada uno, y los handlers/estrategias son puros (sin DI ni base de datos), por lo que también corren en `scripts/demo.ts`.
5. **Respuesta y errores uniformes** vía filtro e interceptor globales; los controllers solo devuelven `ServiceResult`.
6. **Correcciones respecto al BoilerPlate:** `meta.total` es el total real, la validación de entorno es explícita, no hay secretos por defecto y la documentación describe solo lo que existe.

## Flujo de `POST /ventas`

```
Controller → VentasService.crear
  └─ TRANSACTION_RUNNER.run
       ├─ cargar cliente y producto                  (404 si no existen)
       ├─ PricingEngine.calcular(...)                STRATEGY: filtra aplica(), ordena por prioridad, cascada
       ├─ PEDIDO_CHAIN.handle(pedido)                CHAIN: Cliente → Stock → Límite → Pago (corta en el primer rechazo)
       ├─ if (!aprobado) throw resultado.error       rollback
       ├─ ProductosService.ajustarStock(-n)
       └─ IVentaRepository.create(subtotal, total, envio, medioPago)
```

Cualquier excepción provoca rollback. El UML completo y los diagramas de secuencia están en `DIAGRAMA-CLASES.md`.

7. **Por qué el precio se calcula antes de la cadena.** `ValidarPago` compara el saldo contra el precio final; sin precio no hay con qué validar. Por eso Strategy corre primero y su `total` entra a la cadena como `precioFinal`.
8. **Rechazo como valor, no excepción.** Los handlers devuelven un resultado y la cadena se corta; `VentasService` lanza el error una sola vez. Conserva la traza completa y mantiene los códigos HTTP existentes.
9. **Registries como composition root.** `pricing.registry.ts` y `pedido-handlers.registry.ts` son los únicos archivos que nombran las clases concretas. Agregar una regla es un archivo nuevo más una línea ahí.
