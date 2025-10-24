import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from './usuario.entity';

export enum RolEquipo {
  RESPONSABLE = 'responsable',
  COLABORADOR = 'colaborador',
}

@Entity('equipos')
export class Equipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Proyecto, (p) => p.equipos, { onDelete: 'CASCADE' })
  proyecto!: Proyecto;

  @ManyToMany(() => Usuario)
  @JoinTable()
  miembros!: Usuario[];

  @Column({ type: 'enum', enum: RolEquipo })
  rolEnEquipo!: RolEquipo;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaAsignacion!: Date;
}
