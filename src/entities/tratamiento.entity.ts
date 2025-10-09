import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Repeticion } from './repeticion.entity';

@Entity()
export class Tratamiento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.tratamientos)
  proyecto!: Proyecto;

  @OneToMany(() => Repeticion, (repeticion) => repeticion.tratamiento)
  repeticiones!: Repeticion[];
}