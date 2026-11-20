import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module';
import { ProductosModule } from '../productos/productos.module';
import { PricingEngine } from './pricing/pricing.engine';
import { ESTRATEGIAS_DE_PRECIO } from './pricing/pricing.registry';
import { PRICING_STRATEGIES } from './pricing/pricing-strategy.interface';
import { VENTA_REPOSITORY } from './repositories/venta.repository.interface';
import { VentaTypeOrmRepository } from './repositories/venta.typeorm.repository';
import { construirCadena } from './rules/pedido-chain.builder';
import { PEDIDO_CHAIN } from './rules/pedido-handler.interface';
import { crearHandlersDePedido } from './rules/pedido-handlers.registry';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [ClientesModule, ProductosModule],
  controllers: [VentasController],
  providers: [
    VentasService,
    PricingEngine,
    // Strategy: las estrategias salen del registry (no se listan aquí una por una).
    { provide: PRICING_STRATEGIES, useValue: ESTRATEGIAS_DE_PRECIO },
    // Chain: se arma una vez al iniciar, en el orden del registry.
    { provide: PEDIDO_CHAIN, useFactory: () => construirCadena(crearHandlersDePedido()) },
    { provide: VENTA_REPOSITORY, useClass: VentaTypeOrmRepository },
  ],
})
export class VentasModule {}
