import { BusinessRuleError } from '../../../../common/errors';
import { AbstractPedidoHandler } from '../abstract-pedido.handler';
import { PedidoContext, ResultadoPaso } from '../pedido-context';

/** Eslabón 1: el cliente debe poder comprar (no estar bloqueado). */
export class ValidarClienteHandler extends AbstractPedidoHandler {
  readonly nombre = 'Validar Cliente';

  protected validar(ctx: PedidoContext): ResultadoPaso {
    if (ctx.cliente.bloqueado) {
      return this.rechazar(
        new BusinessRuleError('Cliente bloqueado', 'CLIENTE_BLOQUEADO'),
        `El cliente ${ctx.cliente.nombre} está bloqueado`
      );
    }
    return this.aprobar(`El cliente ${ctx.cliente.nombre} está habilitado`);
  }
}
