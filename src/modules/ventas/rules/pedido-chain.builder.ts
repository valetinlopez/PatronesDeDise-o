import { PedidoHandler } from './pedido-handler.interface';

/**
 * Enlaza los handlers en el orden recibido y devuelve la cabeza de la cadena.
 * El orden de la lista ES el orden de ejecución.
 */
export function construirCadena(handlers: readonly PedidoHandler[]): PedidoHandler {
  if (handlers.length === 0) {
    throw new Error('La cadena de validación necesita al menos un handler');
  }
  handlers.reduce((anterior, actual) => anterior.setNext(actual));
  return handlers[0];
}
