import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Tratamiento } from './tratamiento.entity';
import { Muestra } from './muestra.entity';

@Entity('repeticiones')
export class Repeticion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tratamiento, (t) => t.repeticiones, { onDelete: 'CASCADE' })
  tratamiento!: Tratamiento;

  @Column()
  numero!: number;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @OneToMany(() => Muestra, (m) => m.repeticion)
  muestras!: Muestra[];
}
