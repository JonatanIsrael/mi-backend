import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Lectura } from './lectura.entity';

@Entity()
export class Observacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  descripcion!: string;

  @Column()
  fecha!: Date;

  @ManyToOne(() => Lectura, (lectura) => lectura.observaciones)
  lectura!: Lectura;
}