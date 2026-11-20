import { Injectable } from '@nestjs/common';
import { Paginated, PaginationParams } from '../../../common/interfaces';
import { TransactionContext } from '../../../database/transaction-context';
import { Venta } from '../entities/venta.entity';
import { IVentaRepository, NuevaVenta } from './venta.repository.interface';

@Injectable()
export class VentaTypeOrmRepository implements IVentaRepository {
  constructor(private readonly tx: TransactionContext) {}

  private get repo() {
    return this.tx.manager.getRepository(Venta);
  }

  async findAll({ page, limit }: PaginationParams): Promise<Paginated<Venta>> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  findById(id: number): Promise<Venta | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: NuevaVenta): Promise<Venta> {
    return this.repo.save(this.repo.create(data));
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
