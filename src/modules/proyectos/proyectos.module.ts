import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { ProyectosService } from './proyectos.service';
import { ProyectosController } from './proyectos.controller';
import { AuthModule } from '../../auth/auth.module';
import { TratamientosModule } from '../tratamientos/tratamientos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proyecto]),
    AuthModule,
    forwardRef(() => TratamientosModule), // rompe la circularidad
  ],
  controllers: [ProyectosController],
  providers: [ProyectosService],
  exports: [ProyectosService],
})
export class ProyectosModule {}
