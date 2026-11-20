# Common - Piezas Transversales

## Responsabilidad

Esta capa es responsable de:
- `errors/`: `AppError` y subclases (`NotFoundError` 404, `ValidationError` 400, `ConflictError` 409, `BusinessRuleError` 400)
- `filters/`: `AllExceptionsFilter` — formato `{ success:false, error:{ code, message, details? } }`
- `interceptors/`: `TransformResponseInterceptor` (`{ success, message, data, meta? }`) y `LoggingInterceptor`
- `interfaces/`: `ServiceResult`, `IRepository`, `Paginated`, `TransactionRunner` + `TRANSACTION_RUNNER`
- `dto/`: `IdParamDto`, `PaginationQueryDto` (`page` default 1, `limit` default 20, máx 100)
- `logger/`: `LoggerModule` (winston: consola + `logs/error.log` y `logs/combined.log` fuera de test/producción)

## Reglas para AI Agents

- Nada en `common/` puede importar de `modules/`.
- Errores de negocio: `throw new BusinessRuleError(mensaje, 'CODIGO')`. No lanzar `HttpException` desde services.
- `meta.total` es el total real (se calcula con `findAndCount`), no el tamaño de la página.
