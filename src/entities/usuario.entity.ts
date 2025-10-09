import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ unique: true })
  correo!: string;

  @Column()
  contrasena!: string;

  @Column()
  rol!: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro!: Date;
}
