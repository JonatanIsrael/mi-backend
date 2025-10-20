import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Proyecto } from './proyecto.entity';

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
}
