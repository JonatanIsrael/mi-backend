import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Proyecto } from './proyecto.entity';

@Entity()
export class Calendario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  titulo!: string;

  @Column()
  fecha!: Date;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.calendarios)
  proyecto!: Proyecto;
}