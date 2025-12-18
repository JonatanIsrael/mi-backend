import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, BeforeUpdate } from 'typeorm';
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

  @Column({ default: false })
  notificado!: boolean; 


  @Column({ name: 'notificado_24h', default: false })
  notificado24h!: boolean; 

  @Column({ name: 'notificado_1h', default: false })
  notificado1h!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fechaCreacion!: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaActualizacion!: Date;

  @BeforeInsert()
  setFechasCreacion() {
    this.fechaCreacion = new Date();
    this.fechaActualizacion = new Date();
  }

  @BeforeUpdate()
  setFechaActualizacion() {
    this.fechaActualizacion = new Date();
  }
}