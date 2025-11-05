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

  @Column({ length: 255 })
  variableIndependiente!: string;

  @Column({ length: 50})
  factor!: string;

  @Column({ length: 50 })
  nivel!: string;

  @OneToMany(() => Repeticion, (r) => r.tratamiento)
  repeticiones!: Repeticion[];
}
