import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Alerta } from './alerta.entity';
import { Calendario } from './calendario.entity';
import { Equipo } from './equipo.entity';
import { Observacion } from './observacion.entity';
import { Tratamiento } from './tratamiento.entity';
import { VariableDependiente } from './variable-dependiente.entity';
import { Comentario } from './comentario.entity';

export enum TipoDisenio {
  COMPLETAMENTE_ALEATORIO = 'completamente_aleatorio',
  POR_BLOQUES = 'por_bloques',
  POR_ESTRATOS = 'por_estratos',
  BLOQUEADO = 'bloqueado',
}

@Entity('proyectos')
export class Proyecto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @ManyToOne(() => Usuario, (u) => u.proyectos, { onDelete: 'CASCADE' })
  investigadorPrincipal!: Usuario;

  @Column({ type: 'date', nullable: true})
  fechaInicio!: Date | null;

  @Column({ type: 'date', nullable: true })
  fechaFin!: Date | null;

  @Column({ type: 'enum', enum: TipoDisenio })
  tipoDisenio!: TipoDisenio;

  @OneToMany(() => Alerta, (a) => a.proyecto)
  alertas!: Alerta[];

  @OneToMany(() => Calendario, (c) => c.proyecto)
  calendarios!: Calendario[];

  @OneToMany(() => Equipo, (e) => e.proyecto)
  equipos!: Equipo[];

  @OneToMany(() => Observacion, (o) => o.proyecto)
  observaciones!: Observacion[];

  @OneToMany(() => Tratamiento, (t) => t.proyecto)
  tratamientos!: Tratamiento[];

  @OneToMany(() => VariableDependiente, (v) => v.proyecto)
  variablesDependientes!: VariableDependiente[];

  @OneToMany(() => Comentario, (comentario) => comentario.proyecto)
  comentarios!: Comentario[];

}
