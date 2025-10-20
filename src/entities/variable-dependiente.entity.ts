import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Lectura } from './lectura.entity';

@Entity('variables_dependientes')
export class VariableDependiente {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Proyecto, (p) => p.variablesDependientes, { onDelete: 'CASCADE' })
  proyecto!: Proyecto;

  @Column({ length: 255 })
  nombreCompleto!: string;

  @Column({ length: 10 })
  clave!: string;

  @Column({ length: 50 })
  unidad!: string;

  @OneToMany(() => Lectura, (l) => l.variableDependiente)
  lecturas!: Lectura[];
}
