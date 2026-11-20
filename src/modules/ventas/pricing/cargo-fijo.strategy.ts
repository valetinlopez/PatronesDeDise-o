import { PricingContext, PricingStrategy } from './pricing-strategy.interface';

/** Prioridad de los cargos fijos: siempre después de todos los descuentos. */
export const PRIORIDAD_CARGO = 90;

/** Base para todo cargo de monto fijo (envíos). */
export abstract class CargoFijoStrategy implements PricingStrategy {
  abstract readonly nombre: string;
  protected abstract readonly monto: number;
  readonly prioridad = PRIORIDAD_CARGO;
  abstract aplica(ctx: PricingContext): boolean;

  aplicar(precioActual: number, _ctx?: PricingContext): number {
    return precioActual + this.monto;
  }

  descripcion(_ctx?: PricingContext): string {
    return `+$${this.monto.toLocaleString('es-AR')}`;
  }
}
