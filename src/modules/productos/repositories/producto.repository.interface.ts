import { IRepository } from '../../../common/interfaces';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { Producto } from '../entities/producto.entity';

export interface IProductoRepository
  extends IRepository<Producto, CreateProductoDto, UpdateProductoDto> {
  /** true si existen ventas que referencian al producto. */
  tieneVentas(id: number): Promise<boolean>;
}

export const PRODUCTO_REPOSITORY = Symbol('PRODUCTO_REPOSITORY');
