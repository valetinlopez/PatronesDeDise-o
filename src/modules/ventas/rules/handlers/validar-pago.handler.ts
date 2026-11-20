import { BusinessRuleError } from '../../../../common/errors';
import { AbstractPedidoHandler } from '../abstract-pedido.handler';
import { PedidoContext, ResultadoPaso } from '../pedido-context';

const pesos = (n: number): string => `$${n.toLocaleString('es-AR')}`;

/**
 * Eslabón 3: el pago simulado debe cubrir el precio final.
 * Va al final porque es el control más "caro" de revertir en un sistema real.
 */
export class ValidarPagoHandler extends AbstractPedidoHandler {
  readonly nombre = 'Validar Pago';

  protected validar(ctx: PedidoContext): ResultadoPaso {
    const { medio, saldoDisponible } = ctx.pago;
    if (saldoDisponible < ctx.precioFinal) {
      return this.rechazar(
        new BusinessRuleError('Pago rechazado: saldo insuficiente', 'PAGO_RECHAZADO'),
        `Pago rechazado (${medio}): saldo ${pesos(saldoDisponible)} < total ${pesos(ctx.precioFinal)}`
      );
    }
    return this.aprobar(
      `Pago aceptado (${medio}): saldo ${pesos(saldoDisponible)} >= total ${pesos(ctx.precioFinal)}`
    );
  }
}
