import { Injectable } from '@nestjs/common';
import { Paginated, PaginationParams } from '../../../common/interfaces';
import { TransactionContext } from '../../../database/transaction-context';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { Producto } from '../entities/producto.entity';
import { IProductoRepository } from './producto.repository.interface';

@Injectable()
export class ProductoTypeOrmRepository implements IProductoRepository {
  constructor(private readonly tx: TransactionContext) {}

  private get repo() {
    return this.tx.manager.getRepository(Producto);
  }

  async findAll({ page, limit }: PaginationParams): Promise<Paginated<Producto>> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  findById(id: number): Promise<Producto | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: CreateProductoDto): Promise<Producto> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: UpdateProductoDto): Promise<Producto> {
    await this.repo.update(id, data);
    return (await this.findById(id)) as Producto;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async tieneVentas(id: number): Promise<boolean> {
    const rows = await this.tx.manager.query('SELECT 1 FROM ventas WHERE producto_id = ? LIMIT 1', [id]);
    return rows.length > 0;
  }
}
