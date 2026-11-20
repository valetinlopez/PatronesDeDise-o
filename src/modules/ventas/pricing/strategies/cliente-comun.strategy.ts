import { TipoCliente } from '../../../clientes/entities/tipo-cliente.enum';
import { DescuentoPorcentualStrategy } from '../descuento-porcentual.strategy';
import { PricingContext } from '../pricing-strategy.interface';

/** Cliente común: 0% (se registra igual para que quede visible en el detalle). */
export class ClienteComunStrategy extends DescuentoPorcentualStrategy {
  readonly nombre = 'Cliente común';
  readonly prioridad = 10;
  protected readonly porcentaje = 0;

  aplica(ctx: PricingContext): boolean {
    return ctx.cliente.tipo === TipoCliente.COMUN;
  }
}
