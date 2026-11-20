import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdParamDto, PaginationQueryDto } from '../../common/dto';
import { buildMeta, ServiceResult } from '../../common/interfaces';
import { CotizarVentaDto } from './dto/cotizar-venta.dto';
import { CreateVentaDto } from './dto/create-venta.dto';
import { Venta } from './entities/venta.entity';
import { PricingResult } from './pricing/pricing.engine';
import { VentasService } from './ventas.service';

@ApiTags('Ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly service: VentasService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<ServiceResult<Venta[]>> {
    const { items, total } = await this.service.findAll(query);
    return { message: 'Ventas obtenidas', data: items, meta: buildMeta(total, query) };
  }

  @Get(':id')
  async findOne(@Param() { id }: IdParamDto): Promise<ServiceResult<Venta>> {
    return { message: 'Venta obtenida', data: await this.service.findOne(id) };
  }

  /** Muestra qué estrategias se aplican y el precio final, sin crear la venta. */
  @Post('cotizar')
  @HttpCode(200)
  async cotizar(@Body() dto: CotizarVentaDto): Promise<ServiceResult<PricingResult>> {
    return { message: 'Cotización calculada', data: await this.service.cotizar(dto) };
  }

  @Post()
  async crear(@Body() dto: CreateVentaDto): Promise<ServiceResult<Venta>> {
    return { message: 'Venta creada', data: await this.service.crear(dto) };
  }

  /** Cancelar = restaurar stock y borrar la venta (comportamiento del original). */
  @Delete(':id')
  async cancelar(@Param() { id }: IdParamDto): Promise<ServiceResult<Venta>> {
    return { message: 'Venta cancelada', data: await this.service.cancelar(id) };
  }
}
