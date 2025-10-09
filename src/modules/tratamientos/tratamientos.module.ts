import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TratamientosService } from './tratamientos.service';
import { TratamientosController } from './tratamientos.controller';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { ProyectosModule } from '../proyectos/proyectos.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tratamiento]),
    forwardRef(() => ProyectosModule), // rompe la circularidad
    AuthModule,
  ],
  controllers: [TratamientosController],
  providers: [TratamientosService],
  exports: [TratamientosService],
})
export class TratamientosModule {}
