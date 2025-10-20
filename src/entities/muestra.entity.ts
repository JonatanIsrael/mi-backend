import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Repeticion } from './repeticion.entity';
import { Lectura } from './lectura.entity';

@Entity('muestras')
export class Muestra {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Repeticion, (r) => r.muestras, { onDelete: 'CASCADE' })
  repeticion!: Repeticion;

  @Column()
  numero!: number;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @OneToMany(() => Lectura, (l) => l.muestra)
  lecturas!: Lectura[];
}
