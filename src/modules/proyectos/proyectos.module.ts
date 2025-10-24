import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { Repeticion } from '../../entities/repeticion.entity';
import { Muestra } from '../../entities/muestra.entity';
import { Lectura } from '../../entities/lectura.entity';
import { Equipo } from '../../entities/equipo.entity'; // 🔹 Asegúrate de importarlo
import { ProyectosService } from './proyectos.service';
import { ProyectosController } from './proyectos.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthModule } from '../../auth/auth.module';
import { Usuario } from 'entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proyecto,
      Tratamiento,
      VariableDependiente,
      Repeticion,
      Muestra,
      Lectura,
      Equipo, 
      Usuario// 🔹 Aquí se incluye para que NestJS pueda inyectar su repositorio
    ]),
    forwardRef(() => UsuariosModule),
    forwardRef(() => AuthModule),
  ],
  providers: [ProyectosService],
  controllers: [ProyectosController],
  exports: [ProyectosService],
})
export class ProyectosModule {}
