import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Muestra } from './muestra.entity';
import { VariableDependiente } from './variable-dependiente.entity';
import { Observacion } from './observacion.entity';

@Entity()
export class Lectura {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Muestra, (muestra) => muestra.lecturas)
  muestra!: Muestra;

  @ManyToOne(() => VariableDependiente, (variable) => variable.lecturas)
  variable!: VariableDependiente;

  @Column('float')
  valor!: number;

  @Column()
  fecha!: Date;

  @OneToMany(() => Observacion, (observacion) => observacion.lectura)
  observaciones!: Observacion[];
}