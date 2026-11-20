import { BusinessRuleError } from '../../../../common/errors';
import { AbstractPedidoHandler } from '../abstract-pedido.handler';
import { PedidoContext, ResultadoPaso } from '../pedido-context';

/** Eslabón 2: debe haber stock suficiente del producto. */
export class ValidarStockHandler extends AbstractPedidoHandler {
  readonly nombre = 'Validar Stock';

  protected validar(ctx: PedidoContext): ResultadoPaso {
    const { stock, nombre } = ctx.producto;
    if (stock < ctx.cantidad) {
      return this.rechazar(
        new BusinessRuleError('Stock insuficiente', 'STOCK_INSUFICIENTE'),
        `Stock insuficiente de "${nombre}": disponible ${stock}, solicitado ${ctx.cantidad}`
      );
    }
    return this.aprobar(`Hay stock de "${nombre}": disponible ${stock}, solicitado ${ctx.cantidad}`);
  }
}
