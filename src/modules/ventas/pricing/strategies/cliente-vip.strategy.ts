import { TipoCliente } from '../../../clientes/entities/tipo-cliente.enum';
import { DescuentoPorcentualStrategy } from '../descuento-porcentual.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Cliente VIP: 15%. */
export class ClienteVipStrategy extends DescuentoPorcentualStrategy {
  readonly nombre = 'Cliente VIP';
  readonly prioridad = 10;
  protected readonly porcentaje = 15;

  aplica(ctx: PricingContext): boolean {
    return ctx.cliente.tipo === TipoCliente.VIP;
  }
}
