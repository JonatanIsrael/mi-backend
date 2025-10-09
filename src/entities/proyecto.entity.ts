import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Equipo } from './equipo.entity';
import { Tratamiento } from './tratamiento.entity';
import { VariableDependiente } from './variable-dependiente.entity';
import { Alerta } from './alerta.entity';
import { Calendario } from './calendario.entity';

@Entity()
export class Proyecto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column()
  descripcion!: string;

  @Column()
  id_investigador_principal!: number;

  @Column()
  tipo_disenio!: string;

  @OneToMany(() => Equipo, (equipo) => equipo.proyecto)
  equipo!: Equipo[];

  @OneToMany(() => Tratamiento, (tratamiento) => tratamiento.proyecto)
  tratamientos!: Tratamiento[];

  @OneToMany(() => VariableDependiente, (variable) => variable.proyecto)
  variables!: VariableDependiente[];

  @OneToMany(() => Alerta, (alerta) => alerta.proyecto)
  alertas!: Alerta[];

  @OneToMany(() => Calendario, (calendario) => calendario.proyecto)
  calendarios!: Calendario[];
}