import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundError } from '../../common/errors';
import { Paginated, PaginationParams, TRANSACTION_RUNNER, TransactionRunner } from '../../common/interfaces';
import { ClientesService } from '../clientes/clientes.service';
import { ProductosService } from '../productos/productos.service';
import { CotizarVentaDto } from './dto/cotizar-venta.dto';
import { CreateVentaDto } from './dto/create-venta.dto';
import { MetodoEnvio } from './entities/metodo-envio.enum';
import { Venta } from './entities/venta.entity';
import { PricingEngine, PricingResult } from './pricing/pricing.engine';
import { IVentaRepository, VENTA_REPOSITORY } from './repositories/venta.repository.interface';
import { PEDIDO_CHAIN, PedidoHandler } from './rules/pedido-handler.interface';

/**
 * Orquesta el caso de uso. No contiene reglas de precio ni de validación:
 *   - el precio lo calcula PricingEngine (Strategy)
 *   - los controles los hace la cadena PEDIDO_CHAIN (Chain of Responsibility)
 */
@Injectable()
export class VentasService {
  private readonly logger = new Logger(VentasService.name);

  constructor(
    @Inject(VENTA_REPOSITORY) private readonly repo: IVentaRepository,
    @Inject(TRANSACTION_RUNNER) private readonly tx: TransactionRunner,
    @Inject(PEDIDO_CHAIN) private readonly cadena: PedidoHandler,
    private readonly pricing: PricingEngine,
    private readonly clientes: ClientesService,
    private readonly productos: ProductosService
  ) {}

  findAll(pagination: PaginationParams): Promise<Paginated<Venta>> {
    return this.repo.findAll(pagination);
  }

  async findOne(id: number): Promise<Venta> {
    const venta = await this.repo.findById(id);
    if (!venta) throw new NotFoundError('Venta no encontrada');
    return venta;
  }

  /** Calcula el precio (Strategy) sin validar ni persistir nada. */
  async cotizar(dto: CotizarVentaDto): Promise<PricingResult> {
    return (await this.calcularPrecio(dto)).calculo;
  }

  crear(dto: CreateVentaDto): Promise<Venta> {
    return this.tx.run(async () => {
      // 1. Precio final (Strategy). Si el cliente o el producto no existen, 404.
      const { cliente, producto, calculo, envio } = await this.calcularPrecio(dto);

      // 2. Controles del pedido (Chain of Responsibility).
      const resultado = await this.cadena.handle({
        cliente,
        producto,
        cantidad: dto.cantidad,
        precioFinal: calculo.total,
        pago: dto.pago,
        traza: [],
      });
      resultado.traza.forEach((p) =>
        this.logger.log(`${p.ok ? 'OK ' : 'ERR'} ${p.handler}: ${p.detalle}`)
      );

      // 3. Si algún eslabón rechazó, se lanza su error y la transacción hace rollback.
      if (!resultado.aprobado) throw resultado.error;

      // 4. Pedido aprobado: se descuenta el stock y se registra la venta.
      await this.productos.ajustarStock(dto.productoId, -dto.cantidad);
      return this.repo.create({
        clienteId: dto.clienteId,
        productoId: dto.productoId,
        cantidad: dto.cantidad,
        subtotal: calculo.subtotal,
        envio,
        medioPago: dto.pago.medio,
        total: calculo.total,
        fecha: new Date().toISOString().split('T')[0],
      });
    });
  }

  cancelar(id: number): Promise<Venta> {
    return this.tx.run(async () => {
      const venta = await this.findOne(id);
      await this.productos.ajustarStock(venta.productoId, venta.cantidad);
      await this.repo.delete(id);
      return venta;
    });
  }

  private async calcularPrecio(dto: CotizarVentaDto) {
    const cliente = await this.clientes.findOne(dto.clienteId);
    const producto = await this.productos.findOne(dto.productoId);
    const envio = dto.envio ?? MetodoEnvio.RETIRO;
    const calculo = this.pricing.calcular({
      cliente,
      precioUnitario: producto.precio,
      cantidad: dto.cantidad,
      envio,
      promociones: dto.promociones ?? [],
    });
    return { cliente, producto, calculo, envio };
  }
}
