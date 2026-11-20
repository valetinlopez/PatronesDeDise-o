import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionRunner } from '../common/interfaces';

/**
 * Implementa el puerto TransactionRunner con TypeORM.
 * Los repositorios piden `manager` aquí: dentro de run() obtienen el manager transaccional,
 * fuera de run() el manager normal. Así los services no conocen DataSource ni QueryRunner.
 */
@Injectable()
export class TransactionContext implements TransactionRunner {
  private readonly storage = new AsyncLocalStorage<EntityManager>();

  constructor(private readonly dataSource: DataSource) {}

  get manager(): EntityManager {
    return this.storage.getStore() ?? this.dataSource.manager;
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.storage.getStore()) return work(); // ya estamos dentro de una transacción
    return this.dataSource.transaction((em) => this.storage.run(em, work));
  }
}
