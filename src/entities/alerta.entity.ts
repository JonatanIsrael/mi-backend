import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from './usuario.entity';

export enum TipoAlerta {
  RECORDATORIO = 'recordatorio',
  ANOMALIA = 'anomalia',
}

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Proyecto, (p) => p.alertas, { onDelete: 'CASCADE' })
  proyecto!: Proyecto;

  @ManyToOne(() => Usuario, (u) => u.alertas, { onDelete: 'CASCADE' })
  usuario!: Usuario;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaEnvio!: Date;

  @Column({ type: 'enum', enum: TipoAlerta })
  tipo!: TipoAlerta;
}
