import { PedidoHandler } from './pedido-handler.interface';
import { ValidarClienteHandler } from './handlers/validar-cliente.handler';
import { ValidarLimiteCompraHandler } from './handlers/validar-limite-compra.handler';
import { ValidarPagoHandler } from './handlers/validar-pago.handler';
import { ValidarStockHandler } from './handlers/validar-stock.handler';

/**
 * REGISTRO ÚNICO de la cadena de validación (composition root del patrón Chain).
 * El ORDEN de este array es el orden de ejecución.
 *
 * Para agregar un control: crear su handler en handlers/ y sumar UNA línea aquí, en la
 * posición deseada. No hay que modificar ningún handler existente.
 *
 * Es una función (y no una constante) porque cada handler guarda su "siguiente":
 * cada cadena necesita sus propias instancias.
 */
export function crearHandlersDePedido(): PedidoHandler[] {
  return [
    new ValidarClienteHandler(),
    new ValidarStockHandler(),
    new ValidarLimiteCompraHandler(),
    new ValidarPagoHandler(),
  ];
}
