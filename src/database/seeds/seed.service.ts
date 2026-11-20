import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cliente } from '../../modules/clientes/entities/cliente.entity';
import { TipoCliente } from '../../modules/clientes/entities/tipo-cliente.enum';
import { Producto } from '../../modules/productos/entities/producto.entity';
import { Venta } from '../../modules/ventas/entities/venta.entity';

/** Carga los mismos datos que seed.sql de MVCsistema-ventas, solo si las 3 tablas están vacías. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    await this.run();
  }

  async run(): Promise<boolean> {
    const em = this.dataSource.manager;
    const counts = await Promise.all([em.count(Producto), em.count(Cliente), em.count(Venta)]);
    if (counts.some((c) => c > 0)) return false;

    await em.transaction(async (tx) => {
      await tx.insert(Producto, [
        { nombre: 'Teclado Mecanico', precio: 15000, stock: 10 },
        { nombre: 'Mouse Gamer', precio: 8000, stock: 5 },
        { nombre: 'Monitor 24"', precio: 60000, stock: 3 },
      ]);
      await tx.insert(Cliente, [
        { nombre: 'Juan Perez', email: 'juan@mail.com', bloqueado: false, tipo: TipoCliente.COMUN },
        { nombre: 'Maria Lopez', email: 'maria@mail.com', bloqueado: false, tipo: TipoCliente.PREMIUM },
        { nombre: 'Carlos Ruiz', email: 'carlos@mail.com', bloqueado: true, tipo: TipoCliente.VIP },
        { nombre: 'Lucia Gomez', email: 'lucia@mail.com', bloqueado: false, tipo: TipoCliente.VIP },
      ]);
    });
    this.logger.log('Datos iniciales cargados');
    return true;
  }
}
