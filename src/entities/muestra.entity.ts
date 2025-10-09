import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Repeticion } from './repeticion.entity';
import { Lectura } from './lectura.entity';

@Entity()
export class Muestra {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  numero!: number;

  @ManyToOne(() => Repeticion, (repeticion) => repeticion.muestras)
  repeticion!: Repeticion;

  @OneToMany(() => Lectura, (lectura) => lectura.muestra)
  lecturas!: Lectura[];
}