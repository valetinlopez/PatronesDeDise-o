import { IRepository } from '../../../common/interfaces';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { Cliente } from '../entities/cliente.entity';

export interface IClienteRepository
  extends IRepository<Cliente, CreateClienteDto, UpdateClienteDto> {
  findByEmail(email: string): Promise<Cliente | null>;
  tieneVentas(id: number): Promise<boolean>;
}

export const CLIENTE_REPOSITORY = Symbol('CLIENTE_REPOSITORY');
