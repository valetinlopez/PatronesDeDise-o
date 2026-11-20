import { PricingContext, PricingStrategy } from './pricing-strategy.interface';

/**
 * Base para todo descuento porcentual (Template Method).
 * La subclase solo declara nombre, prioridad, porcentaje y cuándo aplica.
 */
export abstract class DescuentoPorcentualStrategy implements PricingStrategy {
  abstract readonly nombre: string;
  abstract readonly prioridad: number;
  protected abstract readonly porcentaje: number;
  abstract aplica(ctx: PricingContext): boolean;

  aplicar(precioActual: number, _ctx?: PricingContext): number {
    return precioActual * (1 - this.porcentaje / 100);
  }

  descripcion(_ctx?: PricingContext): string {
    return this.porcentaje === 0 ? '0%' : `-${this.porcentaje}%`;
  }
}
