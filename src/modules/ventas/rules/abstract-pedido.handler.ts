import { AppError } from '../../../common/errors';
import { PedidoContext, ResultadoPaso, ResultadoPedido } from './pedido-context';
import { PedidoHandler } from './pedido-handler.interface';

/**
 * Base de todos los handlers (Template Method).
 *
 * handle() fija el algoritmo común:
 *   1. ejecutar validar() (lo único que implementa cada subclase)
 *   2. registrar el paso en la traza
 *   3. si falló  -> CORTAR: devolver el rechazo, el siguiente handler no se invoca
 *      si pasó   -> delegar en el siguiente (o aprobar si es el último)
 *
 * Un handler que necesite otra política (ej. continuar pese a un fallo leve)
 * puede sobreescribir handle().
 */
export abstract class AbstractPedidoHandler implements PedidoHandler {
  abstract readonly nombre: string;
  private siguiente?: PedidoHandler;

  setNext(siguiente: PedidoHandler): PedidoHandler {
    this.siguiente = siguiente;
    return siguiente;
  }

  async handle(ctx: PedidoContext): Promise<ResultadoPedido> {
    const paso = await this.validar(ctx);
    ctx.traza.push({ handler: this.nombre, ok: paso.ok, detalle: paso.detalle });

    if (!paso.ok) {
      return {
        aprobado: false,
        rechazadoPor: this.nombre,
        motivo: paso.detalle,
        error: paso.error,
        traza: ctx.traza,
      };
    }

    return this.siguiente ? this.siguiente.handle(ctx) : { aprobado: true, traza: ctx.traza };
  }

  /** La única responsabilidad específica de cada handler. */
  protected abstract validar(ctx: PedidoContext): Promise<ResultadoPaso> | ResultadoPaso;

  protected aprobar(detalle: string): ResultadoPaso {
    return { ok: true, detalle };
  }

  /** `detalle` es el texto para la traza; por defecto el mensaje del error. */
  protected rechazar(error: AppError, detalle: string = error.message): ResultadoPaso {
    return { ok: false, detalle, error };
  }
}
