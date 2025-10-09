import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Lectura } from './lectura.entity';

@Entity()
export class VariableDependiente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column()
  clave!: string;

  @Column()
  unidad!: string;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.variables)
  proyecto!: Proyecto;

  @OneToMany(() => Lectura, (lectura) => lectura.variable)
  lecturas!: Lectura[];
}