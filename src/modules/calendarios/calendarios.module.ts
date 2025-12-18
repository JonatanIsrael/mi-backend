
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendariosController } from './calendarios.controller';
import { CalendariosService } from './calendarios.service';
import { Calendario } from '../../entities/calendario.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Alerta } from '../../entities/alerta.entity';
import { AuthModule } from '../../auth/auth.module';
import { ProyectosModule } from '../proyectos/proyectos.module';
import { UsuariosModule } from '../usuarios/usuarios.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Calendario, Proyecto, Alerta]),
    AuthModule,
    ProyectosModule,
    UsuariosModule,
  ],
  controllers: [CalendariosController],
  providers: [CalendariosService],
  exports: [CalendariosService],
})
export class CalendariosModule {}