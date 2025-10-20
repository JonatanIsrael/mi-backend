import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Muestra } from './muestra.entity';
import { VariableDependiente } from './variable-dependiente.entity';
import { Observacion } from './observacion.entity';

@Entity('lecturas')
export class Lectura {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Muestra, (m) => m.lecturas, { onDelete: 'CASCADE' })
  muestra!: Muestra;

  @ManyToOne(() => VariableDependiente, (v) => v.lecturas, { onDelete: 'CASCADE' })
  variableDependiente!: VariableDependiente;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor!: number;

  @Column({ type: 'date' })
  fechaLectura!: Date;

  @OneToMany(() => Observacion, (o) => o.lectura)
  observaciones!: Observacion[];
}
