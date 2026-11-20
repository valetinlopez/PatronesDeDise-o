# Pricing - Cálculo del Precio Final (patrón Strategy)

## Responsabilidad

Esta carpeta es responsable de:
- Definir el contrato `PricingStrategy` y el `PricingContext` (`pricing-strategy.interface.ts`)
- `PricingEngine` (`pricing.engine.ts`): el **Context** del patrón. Filtra con `aplica()`, ordena por `prioridad` y aplica **en cascada**
- Bases reutilizables: `DescuentoPorcentualStrategy` y `CargoFijoStrategy`
- Una clase por regla en `strategies/`
- `pricing.registry.ts`: lista única de estrategias registradas (`ESTRATEGIAS_DE_PRECIO`)

## Estrategias registradas

| Clase | Efecto | Aplica cuando | Prioridad |
|---|---|---|---|
| `ClienteComunStrategy` | 0% | tipo = COMUN | 10 |
| `ClientePremiumStrategy` | -10% | tipo = PREMIUM | 10 |
| `ClienteVipStrategy` | -15% | tipo = VIP | 10 |
| `DescuentoCantidadMayorA5Strategy` | -5% | 5 < cantidad <= 10 | 20 |
| `DescuentoCantidadMayorA10Strategy` | -10% | cantidad > 10 | 20 |
| `PromocionEspecialStrategy('PROMO10', 10)` / `('PROMO5', 5)` | -X% | el código viene en `promociones` | 30 |
| `DescuentoBlackFridayStrategy` (Desafío) | -20% | código `BLACK_FRIDAY` | 35 |
| `RetiroEnSucursalStrategy` | +$0 | envio = RETIRO | 90 |
| `EnvioNormalStrategy` | +$5.000 | envio = NORMAL | 90 |
| `EnvioExpressStrategy` | +$10.000 | envio = EXPRESS | 90 |

Ejemplo del TP: $100.000 → VIP ×0,85 → cantidad ×0,90 → PROMO5 ×0,95 → +$10.000 = **$82.675**.

## Reglas para AI Agents

- Una estrategia = una clase = un archivo en `strategies/`. Es **independiente**: no importa ni referencia a otra estrategia.
- Las estrategias son **puras**: sin I/O, sin repositorios, sin `Date.now()`. Solo leen el `PricingContext`.
- Cada una decide si corresponde con `aplica()`. El motor **no** tiene `if` por tipo de cliente, envío ni promoción.
- Descuentos: prioridad < 90 (extender `DescuentoPorcentualStrategy`). Cargos fijos: prioridad 90 (extender `CargoFijoStrategy`), siempre después de los descuentos.
- Si dos reglas no deben acumularse, definir **rangos excluyentes** en `aplica()` (como cantidad >5 y >10); no hacer que una conozca a la otra.
- **No modificar** estrategias existentes para agregar casos: crear una nueva.
- Agregar una estrategia = archivo nuevo en `strategies/` + **una línea** en `pricing.registry.ts` + test unitario. Nada más.
- El orden del registry no importa: el motor ordena por `prioridad`.

## Por qué cascada

Cada estrategia recibe el precio **actual** y devuelve el nuevo, sin conocer a las demás. Sumar porcentajes (aditivo) obligaría a conocer qué otras corrieron. Detalle y números en el `README.md` (sección 3.3).

## Uso fuera de Nest

`new PricingEngine(ESTRATEGIAS_DE_PRECIO)` — lo usa `scripts/demo.ts`.
