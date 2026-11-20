import { DescuentoPorcentualStrategy } from '../descuento-porcentual.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/**
 * Promoción especial parametrizable: aplica si la compra trae el código de la promoción.
 * Se pueden registrar tantas instancias como promociones existan (ej. PROMO10, PROMO5).
 */
export class PromocionEspecialStrategy extends DescuentoPorcentualStrategy {
  readonly nombre: string;
  readonly prioridad = 30;
  protected readonly porcentaje: number;

  constructor(
    private readonly codigo: string,
    porcentaje: number
  ) {
    super();
    this.porcentaje = porcentaje;
    this.nombre = `Promoción especial ${codigo}`;
  }

  aplica(ctx: PricingContext): boolean {
    return ctx.promociones.includes(this.codigo);
  }
}
