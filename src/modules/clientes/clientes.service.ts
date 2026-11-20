import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleError, NotFoundError, ValidationError } from '../../common/errors';
import { Paginated, PaginationParams } from '../../common/interfaces';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { TipoCliente } from './entities/tipo-cliente.enum';
import { CLIENTE_REPOSITORY, IClienteRepository } from './repositories/cliente.repository.interface';

@Injectable()
export class ClientesService {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly repo: IClienteRepository) {}

  findAll(pagination: PaginationParams): Promise<Paginated<Cliente>> {
    return this.repo.findAll(pagination);
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.repo.findById(id);
    if (!cliente) throw new NotFoundError('Cliente no encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto): Promise<Cliente> {
    await this.assertEmailLibre(dto.email);
    return this.repo.create({
      ...dto,
      bloqueado: dto.bloqueado ?? false,
      tipo: dto.tipo ?? TipoCliente.COMUN,
    });
  }

  async update(id: number, dto: UpdateClienteDto): Promise<Cliente> {
    if (Object.keys(dto).length === 0) {
      throw new ValidationError('Debe enviar al menos un campo para actualizar');
    }
    await this.findOne(id);
    if (dto.email) await this.assertEmailLibre(dto.email, id);
    return this.repo.update(id, dto);
  }

  async remove(id: number): Promise<Cliente> {
    const cliente = await this.findOne(id);
    if (await this.repo.tieneVentas(id)) {
      throw new BusinessRuleError(
        'No se puede eliminar el cliente porque tiene ventas asociadas',
        'CLIENTE_CON_VENTAS'
      );
    }
    await this.repo.delete(id);
    return cliente;
  }

  private async assertEmailLibre(email: string, excludeId?: number): Promise<void> {
    const existente = await this.repo.findByEmail(email);
    if (existente && existente.id !== excludeId) {
      throw new BusinessRuleError('Ya existe un cliente con ese email', 'EMAIL_DUPLICADO');
    }
  }
}
