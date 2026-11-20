import { Module } from '@nestjs/common';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { PRODUCTO_REPOSITORY } from './repositories/producto.repository.interface';
import { ProductoTypeOrmRepository } from './repositories/producto.typeorm.repository';

@Module({
  controllers: [ProductosController],
  providers: [
    ProductosService,
    { provide: PRODUCTO_REPOSITORY, useClass: ProductoTypeOrmRepository },
  ],
  exports: [ProductosService],
})
export class ProductosModule {}
