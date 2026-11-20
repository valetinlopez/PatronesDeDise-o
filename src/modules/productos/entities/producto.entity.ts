import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('productos')
@Check('precio > 0')
@Check('stock >= 0')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'real' })
  precio: number;

  @Column({ type: 'integer' })
  stock: number;
}
