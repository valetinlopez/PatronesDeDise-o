import { PedidoContext, ResultadoPedido } from './pedido-context';

/**
 * CHAIN OF RESPONSIBILITY: contrato de un eslabón.
 * Cada handler valida una sola cosa y decide si el pedido sigue o se detiene.
 */
export interface PedidoHandler {
  /** Enlaza el siguiente eslabón y lo devuelve (permite encadenar a.setNext(b).setNext(c)). */
  setNext(siguiente: PedidoHandler): PedidoHandler;
  handle(ctx: PedidoContext): Promise<ResultadoPedido>;
}

/** Token de inyección de la cabeza de la cadena ya armada. */
export const PEDIDO_CHAIN = Symbol('PEDIDO_CHAIN');
