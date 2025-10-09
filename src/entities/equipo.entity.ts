import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from './usuario.entity';

@Entity()
export class Equipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.equipo)
  proyecto!: Proyecto;

  @ManyToMany(() => Usuario)
  @JoinTable()
  miembros!: Usuario[];
}