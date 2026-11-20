import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdParamDto, PaginationQueryDto } from '../../common/dto';
import { buildMeta, ServiceResult } from '../../common/interfaces';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<ServiceResult<Cliente[]>> {
    const { items, total } = await this.service.findAll(query);
    return { message: 'Clientes obtenidos', data: items, meta: buildMeta(total, query) };
  }

  @Get(':id')
  async findOne(@Param() { id }: IdParamDto): Promise<ServiceResult<Cliente>> {
    return { message: 'Cliente obtenido', data: await this.service.findOne(id) };
  }

  @Post()
  async create(@Body() dto: CreateClienteDto): Promise<ServiceResult<Cliente>> {
    return { message: 'Cliente creado', data: await this.service.create(dto) };
  }

  @Put(':id')
  async update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateClienteDto
  ): Promise<ServiceResult<Cliente>> {
    return { message: 'Cliente actualizado', data: await this.service.update(id, dto) };
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto): Promise<ServiceResult<Cliente>> {
    return { message: 'Cliente eliminado', data: await this.service.remove(id) };
  }
}
