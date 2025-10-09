import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquiposService } from './equipos.service';
import { EquiposController } from './equipos.controller';
import { Equipo } from '../../entities/equipo.entity';
import { UsuariosModule } from '../usuarios/usuarios.module'; // 👈 IMPORTAR AQUÍ
import { ProyectosModule } from '../proyectos/proyectos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipo]),
    UsuariosModule, // 👈 AGREGAR AQUÍ
    ProyectosModule,
    UsuariosModule,
  ],
  providers: [EquiposService],
  controllers: [EquiposController],
})
export class EquiposModule {}
