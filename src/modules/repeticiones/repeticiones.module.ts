import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepeticionesController } from './repeticiones.controller';
import { RepeticionesService } from './repeticiones.service';
import { Repeticion } from '../../entities/repeticion.entity';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { TratamientosModule } from '../tratamientos/tratamientos.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repeticion, Tratamiento]),
    TratamientosModule,
    AuthModule,
  ],
  controllers: [RepeticionesController],
  providers: [RepeticionesService],
  exports: [RepeticionesService],
})
export class RepeticionesModule {}
