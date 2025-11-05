import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Proyecto } from './proyecto.entity';

export enum TipoEvento {
  GENERAL = 'general',
  MEDICION = 'medicion',
  ALERTA = 'alerta',
  REUNION = 'reunion',
  OBSERVACION = 'observacion'
}

@Entity('calendarios')
export class Calendario {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Proyecto, (p) => p.calendarios, { onDelete: 'CASCADE' })
  proyecto!: Proyecto;

  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'enum', enum: TipoEvento, default: TipoEvento.GENERAL })
  tipoEvento!: TipoEvento;
}
