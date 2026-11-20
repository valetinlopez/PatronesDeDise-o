import { DescuentoPorcentualStrategy } from '../descuento-porcentual.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/**
 * Más de 5 productos: 5%.
 * Aplica solo entre 6 y 10 unidades: con más de 10 corresponde el 10%, y los rangos
 * excluyentes evitan que esta estrategia dependa de la otra.
 */
export class DescuentoCantidadMayorA5Strategy extends DescuentoPorcentualStrategy {
  readonly nombre = 'Descuento por cantidad (más de 5)';
  readonly prioridad = 20;
  protected readonly porcentaje = 5;

  aplica(ctx: PricingContext): boolean {
    return ctx.cantidad > 5 && ctx.cantidad <= 10;
  }
}
