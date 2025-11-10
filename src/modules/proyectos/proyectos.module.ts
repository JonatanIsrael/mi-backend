// src/modules/proyectos/proyectos.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { Repeticion } from '../../entities/repeticion.entity';
import { Muestra } from '../../entities/muestra.entity';
import { Lectura } from '../../entities/lectura.entity';
import { Equipo } from '../../entities/equipo.entity';
import { ProyectosService } from './proyectos.service';
import { ProyectosController } from './proyectos.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { Calendario } from '../../entities/calendario.entity';
import { Comentario } from '../../entities/comentario.entity';
import { ComentariosService } from './comentarios.service';
import { AlertasModule } from '../alertas/alertas.module';
import { Usuario } from '../../entities/usuario.entity';
import { Alerta } from '../../entities/alerta.entity';
import { AuthModule } from '../../auth/auth.module'; // ✅ AGREGAR ESTA LÍNEA

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
      Calendario,
      Comentario,
      Usuario,
      Alerta,
    ]),
    UsuariosModule,
    AlertasModule,
    AuthModule, // ✅ AGREGAR AuthModule AQUÍ
  ],
  providers: [
    ProyectosService,
    ComentariosService,
  ],
  controllers: [ProyectosController],
  exports: [ProyectosService],
})
export class ProyectosModule {}