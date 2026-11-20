import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TipoCliente } from './tipo-cliente.enum';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'boolean', default: false })
  bloqueado: boolean;

  @Column({ type: 'varchar', default: TipoCliente.COMUN })
  tipo: TipoCliente;
}
