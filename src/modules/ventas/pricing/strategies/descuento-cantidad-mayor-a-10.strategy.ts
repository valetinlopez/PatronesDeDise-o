import { DescuentoPorcentualStrategy } from '../descuento-porcentual.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Más de 10 productos: 10%. */
export class DescuentoCantidadMayorA10Strategy extends DescuentoPorcentualStrategy {
  readonly nombre = 'Descuento por cantidad (más de 10)';
  readonly prioridad = 20;
  protected readonly porcentaje = 10;

  aplica(ctx: PricingContext): boolean {
    return ctx.cantidad > 10;
  }
}
