import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Proyecto } from './proyecto.entity';

@Entity()
export class Alerta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  tipo!: string; // Ejemplo: 'anomalia', 'recordatorio'

  @Column()
  mensaje!: string;

  @Column()
  fecha!: Date;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.alertas)
  proyecto!: Proyecto;
}