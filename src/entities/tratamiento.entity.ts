import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Repeticion } from './repeticion.entity';

@Entity('tratamientos')
export class Tratamiento {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Proyecto, (p) => p.tratamientos, { onDelete: 'CASCADE' })
  proyecto!: Proyecto;

  @Column({ length: 255 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @Column({ type: 'boolean', default: false })
  esTestigo!: boolean;

  @Column({ length: 255 })
  variableIndependiente!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor!: number;

  @Column({ length: 50 })
  unidad!: string;

  @OneToMany(() => Repeticion, (r) => r.tratamiento)
  repeticiones!: Repeticion[];
}
