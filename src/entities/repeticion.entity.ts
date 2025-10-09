import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tratamiento } from './tratamiento.entity';
import { Muestra } from './muestra.entity';

@Entity()
export class Repeticion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  numero!: number;

  @ManyToOne(() => Tratamiento, (tratamiento) => tratamiento.repeticiones)
  tratamiento!: Tratamiento;

  @OneToMany(() => Muestra, (muestra) => muestra.repeticion)
  muestras!: Muestra[];
}