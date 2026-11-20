import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Producto } from '../../productos/entities/producto.entity';
import { MedioPago } from './medio-pago.enum';
import { MetodoEnvio } from './metodo-envio.enum';

@Entity('ventas')
@Check('cantidad > 0')
@Check('total >= 0')
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cliente_id', type: 'integer' })
  clienteId: number;

  @Column({ name: 'producto_id', type: 'integer' })
  productoId: number;

  @ManyToOne(() => Cliente, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente?: Cliente;

  @ManyToOne(() => Producto, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'producto_id' })
  producto?: Producto;

  @Column({ type: 'integer' })
  cantidad: number;

  /** Precio de lista: precio unitario x cantidad, antes de aplicar estrategias. */
  @Column({ type: 'real', default: 0 })
  subtotal: number;

  @Column({ type: 'varchar', default: MetodoEnvio.RETIRO })
  envio: MetodoEnvio;

  @Column({ name: 'medio_pago', type: 'varchar', default: MedioPago.EFECTIVO })
  medioPago: MedioPago;

  /** Precio final, resultado de aplicar todas las estrategias de precio. */
  @Column({ type: 'real' })
  total: number;

  /** Día de la venta en formato YYYY-MM-DD (igual que el original). */
  @Column({ type: 'varchar' })
  fecha: string;
}
