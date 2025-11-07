// src/entities/comentario.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
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

  @ManyToOne(() => Usuario, (usuario) => usuario.comentarios)
  usuario!: Usuario;

  @Column()
  usuario_id!: number;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.comentarios)
  proyecto!: Proyecto;

  @Column()
  proyecto_id!: number;
}