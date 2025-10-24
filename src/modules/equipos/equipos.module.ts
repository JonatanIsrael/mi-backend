import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipo } from '../../entities/equipo.entity';
import { EquiposService } from './equipos.service';
import { EquiposController } from './equipos.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ProyectosModule } from '../proyectos/proyectos.module';
import { AuthModule } from '../../auth/auth.module'; // 🔹 ruta corregida

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipo]),
    forwardRef(() => UsuariosModule),
    forwardRef(() => ProyectosModule),
    forwardRef(() => AuthModule), 
  ],
  providers: [EquiposService],
  controllers: [EquiposController],
})
export class EquiposModule {}
