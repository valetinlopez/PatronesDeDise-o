import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdParamDto, PaginationQueryDto } from '../../common/dto';
import { buildMeta, ServiceResult } from '../../common/interfaces';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { ProductosService } from './productos.service';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<ServiceResult<Producto[]>> {
    const { items, total } = await this.service.findAll(query);
    return { message: 'Productos obtenidos', data: items, meta: buildMeta(total, query) };
  }

  @Get(':id')
  async findOne(@Param() { id }: IdParamDto): Promise<ServiceResult<Producto>> {
    return { message: 'Producto obtenido', data: await this.service.findOne(id) };
  }

  @Post()
  async create(@Body() dto: CreateProductoDto): Promise<ServiceResult<Producto>> {
    return { message: 'Producto creado', data: await this.service.create(dto) };
  }

  @Put(':id')
  async update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateProductoDto
  ): Promise<ServiceResult<Producto>> {
    return { message: 'Producto actualizado', data: await this.service.update(id, dto) };
  }

  @Delete(':id')
  async remove(@Param() { id }: IdParamDto): Promise<ServiceResult<Producto>> {
    return { message: 'Producto eliminado', data: await this.service.remove(id) };
  }
}
