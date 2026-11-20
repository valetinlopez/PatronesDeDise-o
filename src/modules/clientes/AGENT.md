# Clientes - Módulo de Clientes

## Responsabilidad

Esta capa es responsable de:
- CRUD de clientes (`/api/v1/clientes`)
- Validar `nombre` no vacío, `email` válido (se guarda en minúsculas) y `bloqueado` booleano (default `false`)
- Guardar el `tipo` de cliente (`COMUN` default, `PREMIUM`, `VIP`): lo lee la estrategia de precio de `ventas/pricing/` (0%, 10%, 15%)

## Reglas de negocio

- Email único sin distinguir mayúsculas (400 `Ya existe un cliente con ese email`; en `PUT` se excluye el propio id)
- `PUT` parcial, al menos un campo
- Inexistente → 404 `Cliente no encontrado`
- No se elimina un cliente con ventas asociadas
- Un cliente `bloqueado` no puede comprar (regla en `ventas/rules/handlers/validar-cliente.handler.ts`, no aquí)
- `tipo` fuera de COMUN/PREMIUM/VIP → 400 `El campo tipo debe ser COMUN, PREMIUM o VIP`

## Reglas para AI Agents

- `ClientesService` depende de `IClienteRepository` por el token `CLIENTE_REPOSITORY`.
- Solo `ClientesService` se exporta.
