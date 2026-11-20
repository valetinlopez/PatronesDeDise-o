import { IRepository } from '../../../common/interfaces';
import { Venta } from '../entities/venta.entity';

export type NuevaVenta = Pick<
  Venta,
  'clienteId' | 'productoId' | 'cantidad' | 'subtotal' | 'envio' | 'medioPago' | 'total' | 'fecha'
>;

/** Las ventas no se modifican: solo se crean y se cancelan (borrado), como en el original. */
export type IVentaRepository = Omit<IRepository<Venta, NuevaVenta>, 'update'>;

export const VENTA_REPOSITORY = Symbol('VENTA_REPOSITORY');
