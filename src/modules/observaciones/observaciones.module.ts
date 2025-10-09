import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservacionesController } from './observaciones.controller';
import { ObservacionesService } from './observaciones.service';
import { Observacion } from '../../entities/observacion.entity';
import { Lectura } from '../../entities/lectura.entity';
import { LecturasModule } from '../lecturas/lecturas.module';
import { AuthModule } from '../../auth/auth.module'; // <-- Agregar si se usa JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Observacion, Lectura]),
    LecturasModule,
    AuthModule,
  ],
  controllers: [ObservacionesController],
  providers: [ObservacionesService],
  exports: [ObservacionesService],
})
export class ObservacionesModule {}
