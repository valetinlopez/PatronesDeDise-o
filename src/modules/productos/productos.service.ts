import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleError, NotFoundError, ValidationError } from '../../common/errors';
import { Paginated, PaginationParams } from '../../common/interfaces';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { IProductoRepository, PRODUCTO_REPOSITORY } from './repositories/producto.repository.interface';

@Injectable()
export class ProductosService {
  constructor(@Inject(PRODUCTO_REPOSITORY) private readonly repo: IProductoRepository) {}

  findAll(pagination: PaginationParams): Promise<Paginated<Producto>> {
    return this.repo.findAll(pagination);
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.repo.findById(id);
    if (!producto) throw new NotFoundError('Producto no encontrado');
    return producto;
  }

  create(dto: CreateProductoDto): Promise<Producto> {
    return this.repo.create(dto);
  }

  async update(id: number, dto: UpdateProductoDto): Promise<Producto> {
    if (Object.keys(dto).length === 0) {
      throw new ValidationError('Debe enviar al menos un campo para actualizar');
    }
    await this.findOne(id);
    return this.repo.update(id, dto);
  }

  async remove(id: number): Promise<Producto> {
    const producto = await this.findOne(id);
    if (await this.repo.tieneVentas(id)) {
      throw new BusinessRuleError(
        'No se puede eliminar el producto porque tiene ventas asociadas',
        'PRODUCTO_CON_VENTAS'
      );
    }
    await this.repo.delete(id);
    return producto;
  }

  /** Usado por Ventas. Se ejecuta dentro de la transacción de la venta. */
  async ajustarStock(id: number, delta: number): Promise<Producto> {
    const producto = await this.findOne(id);
    return this.repo.update(id, { stock: producto.stock + delta });
  }
}
