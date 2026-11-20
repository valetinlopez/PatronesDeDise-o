import { TipoCliente } from '../../../clientes/entities/tipo-cliente.enum';
import { DescuentoPorcentualStrategy } from '../descuento-porcentual.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Cliente Premium: 10%. */
export class ClientePremiumStrategy extends DescuentoPorcentualStrategy {
  readonly nombre = 'Cliente Premium';
  readonly prioridad = 10;
  protected readonly porcentaje = 10;

  aplica(ctx: PricingContext): boolean {
    return ctx.cliente.tipo === TipoCliente.PREMIUM;
  }
}
