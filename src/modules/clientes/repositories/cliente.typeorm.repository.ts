import { Injectable } from '@nestjs/common';
import { Paginated, PaginationParams } from '../../../common/interfaces';
import { TransactionContext } from '../../../database/transaction-context';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { Cliente } from '../entities/cliente.entity';
import { TipoCliente } from '../entities/tipo-cliente.enum';
import { IClienteRepository } from './cliente.repository.interface';

@Injectable()
export class ClienteTypeOrmRepository implements IClienteRepository {
  constructor(private readonly tx: TransactionContext) {}

  private get repo() {
    return this.tx.manager.getRepository(Cliente);
  }

  async findAll({ page, limit }: PaginationParams): Promise<Paginated<Cliente>> {
    const [items, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  findById(id: number): Promise<Cliente | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<Cliente | null> {
    return this.repo.findOneBy({ email: email.toLowerCase() });
  }

  create(data: CreateClienteDto): Promise<Cliente> {
    return this.repo.save(this.repo.create({ bloqueado: false, tipo: TipoCliente.COMUN, ...data }));
  }

  async update(id: number, data: UpdateClienteDto): Promise<Cliente> {
    await this.repo.update(id, data);
    return (await this.findById(id)) as Cliente;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async tieneVentas(id: number): Promise<boolean> {
    const rows = await this.tx.manager.query('SELECT 1 FROM ventas WHERE cliente_id = ? LIMIT 1', [id]);
    return rows.length > 0;
  }
}
