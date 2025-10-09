import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuestrasController } from './muestras.controller';
import { MuestrasService } from './muestras.service';
import { Muestra } from '../../entities/muestra.entity';
import { Repeticion } from '../../entities/repeticion.entity';
import { RepeticionesModule } from '../repeticiones/repeticiones.module';
import { AuthModule } from '../../auth/auth.module'; // <-- Agregar si se usa JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Muestra, Repeticion]),
    RepeticionesModule,
    AuthModule,
  ],
  controllers: [MuestrasController],
  providers: [MuestrasService],
  exports: [MuestrasService],
})
export class MuestrasModule {}
