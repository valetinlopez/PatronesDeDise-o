import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { TRANSACTION_RUNNER } from '../common/interfaces';
import { Cliente } from '../modules/clientes/entities/cliente.entity';
import { Producto } from '../modules/productos/entities/producto.entity';
import { Venta } from '../modules/ventas/entities/venta.entity';
import { SeedService } from './seeds/seed.service';
import { TransactionContext } from './transaction-context';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const path = config.getOrThrow<string>('database.path');
        if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
        return {
          type: 'better-sqlite3' as const,
          database: path,
          entities: [Producto, Cliente, Venta],
          synchronize: config.getOrThrow<boolean>('database.synchronize'),
          prepareDatabase: (db: { pragma: (s: string) => void }) => db.pragma('foreign_keys = ON'),
        };
      },
    }),
  ],
  providers: [
    TransactionContext,
    { provide: TRANSACTION_RUNNER, useExisting: TransactionContext },
    SeedService,
  ],
  exports: [TransactionContext, TRANSACTION_RUNNER],
})
export class DatabaseModule {}
