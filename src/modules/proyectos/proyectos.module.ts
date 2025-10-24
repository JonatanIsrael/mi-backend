import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { Repeticion } from '../../entities/repeticion.entity';
import { Muestra } from '../../entities/muestra.entity';
import { Lectura } from '../../entities/lectura.entity';
import { ProyectosService } from './proyectos.service';
import { ProyectosController } from './proyectos.controller';
import { AuthModule } from '../../auth/auth.module';
import { TratamientosModule } from '../tratamientos/tratamientos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proyecto,
      Tratamiento,
      VariableDependiente,
      Repeticion,
      Muestra,
      Lectura,
    ]),
    AuthModule,
    forwardRef(() => TratamientosModule),
    forwardRef(() => UsuariosModule), // <-- para poder usar UsuariosService
  ],
  controllers: [ProyectosController],
  providers: [ProyectosService],
  exports: [ProyectosService],
})
export class ProyectosModule {}
