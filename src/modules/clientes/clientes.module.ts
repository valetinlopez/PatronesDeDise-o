import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { CLIENTE_REPOSITORY } from './repositories/cliente.repository.interface';
import { ClienteTypeOrmRepository } from './repositories/cliente.typeorm.repository';

@Module({
  controllers: [ClientesController],
  providers: [
    ClientesService,
    { provide: CLIENTE_REPOSITORY, useClass: ClienteTypeOrmRepository },
  ],
  exports: [ClientesService],
})
export class ClientesModule {}
