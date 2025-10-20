import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Alerta } from './alerta.entity';
import { Equipo } from './equipo.entity';
import { Observacion } from './observacion.entity';


export enum TipoUsuario{
  ALUMNO = 'alumno',
  MAESTRO = 'maestro',
  ADMINISTRADOR = 'administrador',
}
@Entity('usuarios')
export class Usuario {


  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuario!: string;

   @Column()
  nombre!: string;

  @Column()
  apellido_p!: string;

  @Column()
  apellido_m!: string;

  @Column({ unique: true })
  correo!: string;

  @Column()
  contrasena!: string;

  @Column({
    type: 'enum',
    enum: TipoUsuario,
  })
  rol!: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro!: Date;

  @OneToMany(() => Proyecto, (p) => p.investigadorPrincipal)
  proyectos!: Proyecto[];

  @OneToMany(() => Alerta, (a) => a.usuario)
  alertas!: Alerta[];

  @OneToMany(() => Equipo, (e) => e.miembros)
  equipos!: Equipo[];

  @OneToMany(() => Observacion, (o) => o.usuario)
  observaciones!: Observacion[];
}
