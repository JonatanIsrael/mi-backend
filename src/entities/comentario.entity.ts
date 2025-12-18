import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Proyecto } from './proyecto.entity';

@Entity('comentarios')
export class Comentario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  comentario!: string;

  @CreateDateColumn({ type: 'datetime' })
  fecha_comentario!: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.comentarios, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column()
  usuario_id!: number;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.comentarios, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto!: Proyecto;

  @Column()
  proyecto_id!: number;
}
