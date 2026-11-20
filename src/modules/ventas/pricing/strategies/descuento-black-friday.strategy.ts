import { DescuentoPorcentualStrategy } from '../descuento-porcentual.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Código que activa el descuento en la compra (ver `promociones` en POST /ventas). */
export const CODIGO_BLACK_FRIDAY = 'BLACK_FRIDAY';

/**
 * DESAFÍO: Black Friday, 20% adicional.
 * Se agregó sin tocar ninguna estrategia existente ni el PricingEngine:
 * solo este archivo nuevo + una línea en pricing.registry.ts.
 */
export class DescuentoBlackFridayStrategy extends DescuentoPorcentualStrategy {
  readonly nombre = 'Descuento Black Friday';
  readonly prioridad = 35; // después de las promociones (30), antes del envío (90)
  protected readonly porcentaje = 20;

  aplica(ctx: PricingContext): boolean {
    return ctx.promociones.includes(CODIGO_BLACK_FRIDAY);
  }
}
