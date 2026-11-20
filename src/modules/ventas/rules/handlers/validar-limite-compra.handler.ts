import { BusinessRuleError } from '../../../../common/errors';
import { AbstractPedidoHandler } from '../abstract-pedido.handler';
import { PedidoContext, ResultadoPaso } from '../pedido-context';

export const LIMITE_UNIDADES = 50;
export const LIMITE_MONTO = 1_000_000;

const pesos = (n: number): string => `$${n.toLocaleString('es-AR')}`;

/**
 * DESAFÍO: límite de compra por pedido (unidades y monto).
 * Se agregó sin tocar ningún handler existente: solo este archivo nuevo
 * + una línea en pedido-handlers.registry.ts, entre Stock y Pago.
 */
export class ValidarLimiteCompraHandler extends AbstractPedidoHandler {
  readonly nombre = 'Validar Limite';

  protected validar(ctx: PedidoContext): ResultadoPaso {
    if (ctx.cantidad > LIMITE_UNIDADES) {
      return this.rechazar(
        new BusinessRuleError('Límite de compra excedido', 'LIMITE_COMPRA_EXCEDIDO'),
        `Límite de compra excedido: ${ctx.cantidad} unidades (máximo ${LIMITE_UNIDADES})`
      );
    }
    if (ctx.precioFinal > LIMITE_MONTO) {
      return this.rechazar(
        new BusinessRuleError('Límite de compra excedido', 'LIMITE_COMPRA_EXCEDIDO'),
        `Límite de compra excedido: ${pesos(ctx.precioFinal)} (máximo ${pesos(LIMITE_MONTO)})`
      );
    }
    return this.aprobar(
      `Dentro del límite: ${ctx.cantidad} unidades y ${pesos(ctx.precioFinal)}`
    );
  }
}
