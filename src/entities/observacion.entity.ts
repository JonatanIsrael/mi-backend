import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from './usuario.entity';
import { Lectura } from './lectura.entity';

@Entity('observaciones')
export class Observacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Proyecto, (p) => p.observaciones, { onDelete: 'CASCADE' })
  proyecto!: Proyecto;

  @ManyToOne(() => Lectura, (l) => l.observaciones, { nullable: true, onDelete: 'SET NULL' })
  lectura!: Lectura | null;

  @ManyToOne(() => Usuario, (u) => u.observaciones, { onDelete: 'CASCADE' })
  usuario!: Usuario;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;
}
