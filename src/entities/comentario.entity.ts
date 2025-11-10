// src/entities/comentario.entity.ts
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

  // === RELACIÓN CON USUARIO ===
  @ManyToOne(() => Usuario, (usuario) => usuario.comentarios, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' }) // 🔹 Importante: vincula el campo FK
  usuario!: Usuario;

  @Column()
  usuario_id!: number;

  // === RELACIÓN CON PROYECTO ===
  @ManyToOne(() => Proyecto, (proyecto) => proyecto.comentarios, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto!: Proyecto;

  @Column()
  proyecto_id!: number;
}
