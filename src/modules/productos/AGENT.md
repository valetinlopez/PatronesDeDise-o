# Productos - Módulo de Productos

## Responsabilidad

Esta capa es responsable de:
- CRUD de productos (`/api/v1/productos`)
- Validar `nombre` no vacío, `precio > 0`, `stock >= 0`
- Exponer `ajustarStock(id, delta)` para el módulo de ventas

## Reglas de negocio

- `PUT` es parcial y exige al menos un campo (400 `Debe enviar al menos un campo para actualizar`)
- Inexistente → 404 `Producto no encontrado`
- No se elimina un producto con ventas asociadas (400 `No se puede eliminar el producto porque tiene ventas asociadas`)

## Reglas para AI Agents

- `ProductosService` depende de `IProductoRepository` por el token `PRODUCTO_REPOSITORY`.
- El repositorio TypeORM obtiene el manager de `TransactionContext` para participar en transacciones de otros módulos.
- Solo `ProductosService` se exporta; no exportar el repositorio.
