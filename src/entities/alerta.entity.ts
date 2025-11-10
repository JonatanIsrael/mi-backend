// src/entities/alerta.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Proyecto } from './proyecto.entity';

export enum TipoAlerta {
  PROYECTO_COMPARTIDO = 'proyecto_compartido',
  COMENTARIO = 'comentario',
  OBSERVACION = 'observacion',
  RECORDATORIO = 'recordatorio',
  GENERAL = 'general'
}

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'enum', enum: TipoAlerta, default: TipoAlerta.GENERAL })
  tipo!: TipoAlerta;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaEnvio!: Date;

  @Column({ type: 'boolean', default: false })
  leida!: boolean;

  @ManyToOne(() => Usuario, (usuario) => usuario.alertas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.alertas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto!: Proyecto;
}