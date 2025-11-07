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

  @Column({ type: 'float', nullable: true})
  valor!: number | null;

  @Column({ type: 'date' })
  fechaProgramada!: Date;

  @Column({type: 'timestamp', nullable: true})
  fechaRealizada!: Date | null;

  @OneToMany(() => Observacion, (o) => o.lectura)
  observaciones!: Observacion[];
}
